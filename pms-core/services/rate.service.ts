import { prisma } from "@pms-core/database/client";
import { DomainError } from "@pms-core/lib/errors";
import { formatShort, toDate, toISODate } from "@pms-core/lib/dates";
import {
  planPricesSchema,
  ratePlanInputSchema,
  seasonInputSchema,
  type RatePlanInput,
  type SeasonInput,
} from "@pms-core/lib/rates";
import { normalizeCode } from "@pms-core/lib/slug";
import { auditService } from "@pms-core/services/audit.service";

async function planFor(propertyId: string, id: string) {
  const plan = await prisma.ratePlan.findFirst({ where: { id, propertyId } });
  if (!plan) throw new DomainError("Piano tariffario non trovato.");
  return plan;
}

async function seasonFor(propertyId: string, id: string) {
  const season = await prisma.rateSeason.findFirst({ where: { id, propertyId }, include: { prices: true } });
  if (!season) throw new DomainError("Stagione non trovata.");
  return season;
}

async function assertUniquePlanCode(propertyId: string, code: string, excludeId?: string) {
  const clash = await prisma.ratePlan.findFirst({
    where: { propertyId, code, ...(excludeId ? { id: { not: excludeId } } : {}) },
  });
  if (clash) throw new DomainError(`Esiste già un piano tariffario con codice «${code}».`);
}

async function assertAnotherActivePlan(propertyId: string, excludeId: string) {
  const others = await prisma.ratePlan.count({ where: { propertyId, active: true, id: { not: excludeId } } });
  if (!others) {
    throw new DomainError("Deve restare almeno un piano tariffario attivo, altrimenti nessuna camera è vendibile.");
  }
}

/**
 * Overlap policy: every night belongs to at most one season per rate plan.
 * A season for "all rate plans" therefore clashes with any other season on the
 * same nights, and a plan-specific season clashes with seasons for that plan or
 * for all plans.
 */
async function assertNoOverlap(
  propertyId: string,
  input: { startDate: string; endDate: string; ratePlanId: string | null },
  excludeId?: string,
) {
  const clash = await prisma.rateSeason.findFirst({
    where: {
      propertyId,
      ...(excludeId ? { id: { not: excludeId } } : {}),
      startDate: { lte: toDate(input.endDate) },
      endDate: { gte: toDate(input.startDate) },
      ...(input.ratePlanId ? { OR: [{ ratePlanId: input.ratePlanId }, { ratePlanId: null }] } : {}),
    },
    orderBy: { startDate: "asc" },
  });
  if (clash) {
    throw new DomainError(
      `Si sovrappone a «${clash.name}» (${formatShort(toISODate(clash.startDate))} – ${formatShort(toISODate(clash.endDate))}). Le stagioni non possono sovrapporsi: modifica le date o elimina l'altra stagione.`,
    );
  }
}

async function validSeasonPrices(propertyId: string, prices: { roomTypeId: string; price: number | null }[]) {
  const priced = prices.filter((row): row is { roomTypeId: string; price: number } => row.price !== null);
  if (!priced.length) return [];
  const types = await prisma.roomType.findMany({
    where: { propertyId, id: { in: priced.map((row) => row.roomTypeId) } },
    select: { id: true },
  });
  const known = new Set(types.map((type) => type.id));
  return priced.filter((row) => known.has(row.roomTypeId));
}

function seasonSnapshot(season: {
  name: string;
  ratePlanId: string | null;
  startDate: Date;
  endDate: Date;
  minStay: number | null;
  maxStay: number | null;
  closedToArrival: boolean;
  closedToDeparture: boolean;
  prices?: { roomTypeId: string; price: number }[];
}) {
  return {
    name: season.name,
    ratePlanId: season.ratePlanId,
    startDate: toISODate(season.startDate),
    endDate: toISODate(season.endDate),
    minStay: season.minStay,
    maxStay: season.maxStay,
    closedToArrival: season.closedToArrival,
    closedToDeparture: season.closedToDeparture,
    prices: season.prices?.map((row) => ({ roomTypeId: row.roomTypeId, price: row.price })),
  };
}

export const rateService = {
  list(propertyId: string) {
    return prisma.ratePlan.findMany({
      where: { propertyId },
      include: { prices: { include: { roomType: true } }, _count: { select: { reservations: true } } },
      orderBy: [{ active: "desc" }, { createdAt: "asc" }],
    });
  },

  extras(propertyId: string) {
    return prisma.extra.findMany({ where: { propertyId, active: true }, orderBy: { name: "asc" } });
  },

  roomTypes(propertyId: string) {
    return prisma.roomType.findMany({
      where: { propertyId },
      orderBy: [{ active: "desc" }, { sortOrder: "asc" }],
      select: { id: true, name: true, code: true, basePrice: true, active: true },
    });
  },

  async createPlan(propertyId: string, raw: RatePlanInput, userId?: string) {
    const input = ratePlanInputSchema.parse(raw);
    const code = normalizeCode(input.code);
    await assertUniquePlanCode(propertyId, code);
    const types = await prisma.roomType.findMany({ where: { propertyId, basePrice: { gt: 0 } } });
    const plan = await prisma.ratePlan.create({
      data: {
        propertyId,
        name: input.name,
        code,
        description: input.description ?? "",
        cancellationPolicy: input.cancellationPolicy ?? "",
        depositPercent: input.depositPercent,
        minimumStay: input.minimumStay,
        maximumStay: input.maximumStay,
        isRefundable: input.isRefundable,
        active: input.active,
        prices: { create: types.map((type) => ({ roomTypeId: type.id, basePrice: type.basePrice })) },
      },
    });
    await auditService.record({ propertyId, userId, action: "RATE_PLAN_CREATED", entity: "RatePlan", entityId: plan.id, after: input });
    return plan;
  },

  /** Empty-state shortcut: one standard plan priced from each room type's base price. */
  async ensureDefaultPlan(propertyId: string, userId?: string) {
    const existing = await prisma.ratePlan.findFirst({ where: { propertyId, active: true } });
    if (existing) return existing;
    const dormant = await prisma.ratePlan.findFirst({ where: { propertyId, code: "STD" } });
    if (dormant) return prisma.ratePlan.update({ where: { id: dormant.id }, data: { active: true } });
    return this.createPlan(
      propertyId,
      {
        name: "Tariffa standard",
        code: "STD",
        cancellationPolicy: "Cancellazione gratuita fino a 48 ore prima dell'arrivo.",
        depositPercent: 0,
        minimumStay: 1,
        maximumStay: null,
        isRefundable: true,
        active: true,
      },
      userId,
    );
  },

  async updatePlan(propertyId: string, id: string, raw: RatePlanInput, userId?: string) {
    const before = await planFor(propertyId, id);
    const input = ratePlanInputSchema.parse(raw);
    const code = normalizeCode(input.code);
    await assertUniquePlanCode(propertyId, code, id);
    if (before.active && !input.active) await assertAnotherActivePlan(propertyId, id);
    const plan = await prisma.ratePlan.update({
      where: { id },
      data: {
        name: input.name,
        code,
        description: input.description ?? "",
        cancellationPolicy: input.cancellationPolicy ?? "",
        depositPercent: input.depositPercent,
        minimumStay: input.minimumStay,
        maximumStay: input.maximumStay,
        isRefundable: input.isRefundable,
        active: input.active,
      },
    });
    await auditService.record({ propertyId, userId, action: "RATE_PLAN_UPDATED", entity: "RatePlan", entityId: id, before, after: input });
    return plan;
  },

  async deletePlan(propertyId: string, id: string, userId?: string) {
    const plan = await planFor(propertyId, id);
    const reservations = await prisma.reservation.count({ where: { ratePlanId: id } });
    if (reservations) {
      throw new DomainError(`«${plan.name}» è usata da ${reservations} prenotazioni: disattivala invece di eliminarla.`);
    }
    const channelMaps = await prisma.channelRateMapping.count({ where: { ratePlanId: id } });
    if (channelMaps) throw new DomainError(`«${plan.name}» è collegata a un canale: disattivala invece di eliminarla.`);
    if (plan.active) await assertAnotherActivePlan(propertyId, id);
    await prisma.ratePlan.delete({ where: { id } });
    await auditService.record({ propertyId, userId, action: "RATE_PLAN_DELETED", entity: "RatePlan", entityId: id, before: plan });
  },

  /** Base price per room type. An empty value removes the row, so the room type's own base price applies. */
  async setPlanPrices(propertyId: string, ratePlanId: string, raw: { roomTypeId: string; basePrice: number | null }[], userId?: string) {
    await planFor(propertyId, ratePlanId);
    const rows = planPricesSchema.parse(raw);
    const types = await prisma.roomType.findMany({
      where: { propertyId, id: { in: rows.map((row) => row.roomTypeId) } },
      select: { id: true },
    });
    const known = new Set(types.map((type) => type.id));
    await prisma.$transaction(
      rows
        .filter((row) => known.has(row.roomTypeId))
        .map((row) =>
          row.basePrice === null
            ? prisma.ratePlanPrice.deleteMany({ where: { ratePlanId, roomTypeId: row.roomTypeId } })
            : prisma.ratePlanPrice.upsert({
                where: { ratePlanId_roomTypeId: { ratePlanId, roomTypeId: row.roomTypeId } },
                update: { basePrice: row.basePrice },
                create: { ratePlanId, roomTypeId: row.roomTypeId, basePrice: row.basePrice },
              }),
        ),
    );
    await auditService.record({ propertyId, userId, action: "RATE_PLAN_PRICES", entity: "RatePlan", entityId: ratePlanId, after: rows });
  },

  listSeasons(propertyId: string) {
    return prisma.rateSeason.findMany({
      where: { propertyId },
      include: { prices: true, ratePlan: { select: { id: true, name: true } } },
      orderBy: { startDate: "asc" },
    });
  },

  async createSeason(propertyId: string, raw: SeasonInput, userId?: string) {
    const input = seasonInputSchema.parse(raw);
    if (input.ratePlanId) await planFor(propertyId, input.ratePlanId);
    await assertNoOverlap(propertyId, input);
    const prices = await validSeasonPrices(propertyId, input.prices);
    const season = await prisma.rateSeason.create({
      data: {
        propertyId,
        ratePlanId: input.ratePlanId,
        name: input.name,
        startDate: toDate(input.startDate),
        endDate: toDate(input.endDate),
        minStay: input.minStay,
        maxStay: input.maxStay,
        closedToArrival: input.closedToArrival,
        closedToDeparture: input.closedToDeparture,
        notes: input.notes ?? "",
        prices: { create: prices },
      },
      include: { prices: true },
    });
    await auditService.record({
      propertyId,
      userId,
      action: "RATE_SEASON_CREATED",
      entity: "RateSeason",
      entityId: season.id,
      after: seasonSnapshot(season),
    });
    return season;
  },

  async updateSeason(propertyId: string, id: string, raw: SeasonInput, userId?: string) {
    const before = await seasonFor(propertyId, id);
    const input = seasonInputSchema.parse(raw);
    if (input.ratePlanId) await planFor(propertyId, input.ratePlanId);
    await assertNoOverlap(propertyId, input, id);
    const prices = await validSeasonPrices(propertyId, input.prices);
    const season = await prisma.$transaction(async (tx) => {
      await tx.rateSeasonPrice.deleteMany({ where: { seasonId: id } });
      return tx.rateSeason.update({
        where: { id },
        data: {
          ratePlanId: input.ratePlanId,
          name: input.name,
          startDate: toDate(input.startDate),
          endDate: toDate(input.endDate),
          minStay: input.minStay,
          maxStay: input.maxStay,
          closedToArrival: input.closedToArrival,
          closedToDeparture: input.closedToDeparture,
          notes: input.notes ?? "",
          prices: { create: prices },
        },
        include: { prices: true },
      });
    });
    await auditService.record({
      propertyId,
      userId,
      action: "RATE_SEASON_UPDATED",
      entity: "RateSeason",
      entityId: id,
      before: seasonSnapshot(before),
      after: seasonSnapshot(season),
    });
    return season;
  },

  /** Existing reservations keep the total they were booked at; only new quotes change. */
  async deleteSeason(propertyId: string, id: string, userId?: string) {
    const season = await seasonFor(propertyId, id);
    await prisma.rateSeason.delete({ where: { id } });
    await auditService.record({
      propertyId,
      userId,
      action: "RATE_SEASON_DELETED",
      entity: "RateSeason",
      entityId: id,
      before: seasonSnapshot(season),
    });
  },
};
