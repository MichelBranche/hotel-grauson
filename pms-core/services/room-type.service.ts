import { prisma } from "@pms-core/database/client";
import { roomRepo } from "@pms-core/database/repositories/room.repo";
import { occupyingStatuses } from "@pms-core/config/status";
import { DomainError } from "@pms-core/lib/errors";
import { normalizeCode, slugify } from "@pms-core/lib/slug";
import { roomTypeFieldsSchema, roomTypeInputSchema, type RoomTypeInput } from "@pms-core/lib/structure";
import { auditService } from "@pms-core/services/audit.service";

function typeSnapshot(type: {
  name: string;
  code: string;
  slug: string;
  description: string;
  capacity: number;
  maxAdults: number;
  maxChildren: number;
  sizeM2: number | null;
  beds: string;
  bathroom: string;
  amenities: string;
  images: string;
  basePrice: number;
  active: boolean;
  sortOrder: number;
}) {
  return {
    name: type.name,
    code: type.code,
    slug: type.slug,
    description: type.description,
    capacity: type.capacity,
    maxAdults: type.maxAdults,
    maxChildren: type.maxChildren,
    sizeM2: type.sizeM2,
    beds: type.beds,
    bathroom: type.bathroom,
    amenities: type.amenities,
    images: type.images,
    basePrice: type.basePrice,
    active: type.active,
    sortOrder: type.sortOrder,
  };
}

async function uniqueSlug(propertyId: string, base: string, excludeId?: string) {
  let slug = slugify(base);
  let n = 2;
  for (;;) {
    const clash = await prisma.roomType.findFirst({
      where: { propertyId, slug, ...(excludeId ? { id: { not: excludeId } } : {}) },
    });
    if (!clash) return slug;
    slug = `${slugify(base)}-${n}`;
    n += 1;
  }
}

async function assertUniqueCode(propertyId: string, code: string, excludeId?: string) {
  const existing = await prisma.roomType.findFirst({
    where: { propertyId, code, ...(excludeId ? { id: { not: excludeId } } : {}) },
  });
  if (existing) {
    throw new DomainError(`Esiste già una tipologia con codice «${code}».`);
  }
}

async function seedRatePrices(propertyId: string, roomTypeId: string, basePrice: number) {
  const plans = await prisma.ratePlan.findMany({ where: { propertyId, active: true } });
  if (!plans.length || basePrice <= 0) return;
  await prisma.ratePlanPrice.createMany({
    data: plans.map((plan) => ({
      ratePlanId: plan.id,
      roomTypeId,
      basePrice,
    })),
  });
}

export const roomTypeService = {
  list: roomRepo.types,
  get: roomRepo.type,

  async create(propertyId: string, raw: RoomTypeInput, userId?: string) {
    const input = roomTypeInputSchema.parse(raw);
    const code = normalizeCode(input.code);
    await assertUniqueCode(propertyId, code);
    const slug = await uniqueSlug(propertyId, input.code || input.name);
    const maxSort = await prisma.roomType.aggregate({ where: { propertyId }, _max: { sortOrder: true } });

    const created = await prisma.roomType.create({
      data: {
        propertyId,
        name: input.name,
        code,
        slug,
        description: input.description ?? "",
        capacity: input.capacity,
        maxAdults: input.maxAdults,
        maxChildren: input.maxChildren,
        sizeM2: input.sizeM2 ?? null,
        beds: input.beds ?? "",
        bathroom: input.bathroom ?? "",
        amenities: JSON.stringify(input.amenities ?? []),
        images: JSON.stringify(input.images ?? []),
        basePrice: input.basePrice,
        active: input.active ?? true,
        sortOrder: input.sortOrder ?? (maxSort._max.sortOrder ?? 0) + 1,
      },
    });
    await seedRatePrices(propertyId, created.id, input.basePrice);
    await auditService.record({
      propertyId,
      userId,
      action: "ROOM_TYPE_CREATED",
      entity: "RoomType",
      entityId: created.id,
      after: typeSnapshot(created),
    });
    return roomRepo.type(created.id);
  },

  async update(id: string, raw: Partial<RoomTypeInput>, userId?: string) {
    const type = await prisma.roomType.findUnique({ where: { id } });
    if (!type) throw new DomainError("Tipologia non trovata.");
    const input = roomTypeFieldsSchema.partial().parse(raw);
    const code = input.code ? normalizeCode(input.code) : undefined;
    if (code) await assertUniqueCode(type.propertyId, code, id);
    const slug = input.name || input.code ? await uniqueSlug(type.propertyId, input.code || input.name || type.slug, id) : undefined;
    const nextActive = input.active ?? type.active;
    const action = type.active && nextActive === false ? "ROOM_TYPE_DEACTIVATED" : "ROOM_TYPE_UPDATED";

    const updated = await prisma.roomType.update({
      where: { id },
      data: {
        ...(input.name ? { name: input.name } : {}),
        ...(code ? { code } : {}),
        ...(slug ? { slug } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.capacity ? { capacity: input.capacity } : {}),
        ...(input.maxAdults ? { maxAdults: input.maxAdults } : {}),
        ...(input.maxChildren !== undefined ? { maxChildren: input.maxChildren } : {}),
        ...(input.sizeM2 !== undefined ? { sizeM2: input.sizeM2 } : {}),
        ...(input.beds !== undefined ? { beds: input.beds } : {}),
        ...(input.bathroom !== undefined ? { bathroom: input.bathroom } : {}),
        ...(input.amenities ? { amenities: JSON.stringify(input.amenities) } : {}),
        ...(input.images ? { images: JSON.stringify(input.images) } : {}),
        ...(input.basePrice !== undefined ? { basePrice: input.basePrice } : {}),
        ...(input.active !== undefined ? { active: input.active } : {}),
        ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      },
    });

    await auditService.record({
      propertyId: type.propertyId,
      userId,
      action,
      entity: "RoomType",
      entityId: id,
      before: typeSnapshot(type),
      after: typeSnapshot(updated),
    });
    return roomRepo.type(id);
  },

  async duplicate(id: string, userId?: string) {
    const type = await prisma.roomType.findUnique({
      where: { id },
      include: { ratePrices: true },
    });
    if (!type) throw new DomainError("Tipologia non trovata.");
    const suffix = String(Date.now()).slice(-4);
    const copy = await this.create(
      type.propertyId,
      {
        name: `${type.name} (copia)`,
        code: `${type.code}${suffix}`.slice(0, 16),
        description: type.description,
        capacity: type.capacity,
        maxAdults: type.maxAdults || type.capacity,
        maxChildren: type.maxChildren,
        sizeM2: type.sizeM2,
        beds: type.beds,
        bathroom: type.bathroom,
        amenities: JSON.parse(type.amenities || "[]") as string[],
        images: JSON.parse(type.images || "[]") as string[],
        basePrice: type.basePrice,
        active: false,
      },
      userId,
    );
    if (copy && type.ratePrices.length) {
      await prisma.ratePlanPrice.deleteMany({ where: { roomTypeId: copy.id } });
      await prisma.ratePlanPrice.createMany({
        data: type.ratePrices.map((price) => ({
          ratePlanId: price.ratePlanId,
          roomTypeId: copy.id,
          basePrice: price.basePrice,
        })),
      });
    }
    return roomRepo.type(copy?.id ?? "");
  },

  async setActive(id: string, active: boolean, userId?: string) {
    return this.update(id, { active }, userId);
  },

  async remove(id: string, userId?: string) {
    const type = await prisma.roomType.findUnique({
      where: { id },
      include: {
        _count: { select: { rooms: true, reservations: true, channelMaps: true, inventory: true } },
      },
    });
    if (!type) throw new DomainError("Tipologia non trovata.");

    const reasons: string[] = [];
    if (type._count.rooms > 0) {
      reasons.push(`${type._count.rooms} camere fisiche assegnate`);
    }
    if (type._count.reservations > 0) {
      reasons.push(`${type._count.reservations} prenotazioni che la referenziano`);
    }
    if (type._count.channelMaps > 0) {
      reasons.push("mappature canale attive");
    }
    const future = await prisma.reservation.count({
      where: {
        roomTypeId: id,
        status: { in: occupyingStatuses },
        checkOut: { gt: new Date() },
      },
    });
    if (future > 0) {
      reasons.push(`${future} soggiorni attivi o futuri`);
    }
    if (reasons.length) {
      throw new DomainError(
        `Impossibile eliminare «${type.name}»: ${reasons.join(", ")}. Disattiva la tipologia per toglierla da disponibilità e nuove prenotazioni, conservando lo storico.`,
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.rate.deleteMany({ where: { roomTypeId: id } });
      await tx.ratePlanPrice.deleteMany({ where: { roomTypeId: id } });
      await tx.inventory.deleteMany({ where: { roomTypeId: id } });
      await tx.roomType.delete({ where: { id } });
      await auditService.record({
        tx,
        propertyId: type.propertyId,
        userId,
        action: "ROOM_TYPE_UPDATED",
        entity: "RoomType",
        entityId: id,
        before: typeSnapshot(type),
        after: { deleted: true },
      });
    });
    return { id };
  },
};
