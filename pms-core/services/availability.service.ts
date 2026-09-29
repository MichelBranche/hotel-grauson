import { blockedRoomStatuses, occupyingStatuses } from "@pms-core/config/status";
import { prisma } from "@pms-core/database/client";
import { DomainError } from "@pms-core/lib/errors";
import { formatShort, nightsBetween, toDate, toISODate } from "@pms-core/lib/dates";
import { evaluateStay } from "@pms-core/lib/pricing";
import { loadPricingContext } from "@pms-core/services/pricing.service";
import type { AvailabilityOffer, AvailabilityResult } from "@pms-core/types";

type AvailabilityQuery = {
  propertyId: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children?: number;
  roomTypeId?: string;
  excludeReservationId?: string;
};

/** Room blocks store both nights inclusively; a stay uses nights checkIn … checkOut-1. */
function blockOverlapWhere(checkIn: string, checkOut: string) {
  return { startDate: { lt: toDate(checkOut) }, endDate: { gte: toDate(checkIn) } };
}

export const availabilityService = {
  async search(query: AvailabilityQuery): Promise<AvailabilityOffer[]> {
    return (await this.searchDetailed(query)).offers;
  },

  async searchDetailed(query: AvailabilityQuery): Promise<AvailabilityResult> {
    const nights = nightsBetween(query.checkIn, query.checkOut);
    if (nights < 1) {
      throw new DomainError("La data di check-out deve essere successiva al check-in.");
    }

    const guests = query.adults + (query.children ?? 0);

    const [roomTypes, rooms, reservations, blocks, ctx] = await Promise.all([
      prisma.roomType.findMany({
        where: {
          propertyId: query.propertyId,
          active: true,
          ...(query.roomTypeId ? { id: query.roomTypeId } : {}),
        },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.room.findMany({
        where: {
          propertyId: query.propertyId,
          active: true,
          ...(query.roomTypeId ? { roomTypeId: query.roomTypeId } : {}),
        },
        orderBy: [{ sortOrder: "asc" }, { number: "asc" }],
      }),
      prisma.reservation.findMany({
        where: {
          propertyId: query.propertyId,
          status: { in: occupyingStatuses },
          checkIn: { lt: toDate(query.checkOut) },
          checkOut: { gt: toDate(query.checkIn) },
          ...(query.excludeReservationId ? { id: { not: query.excludeReservationId } } : {}),
        },
        select: { roomId: true },
      }),
      prisma.roomBlock.findMany({
        where: { propertyId: query.propertyId, ...blockOverlapWhere(query.checkIn, query.checkOut) },
        select: { roomId: true },
      }),
      loadPricingContext(query.propertyId, query.checkIn, query.checkOut),
    ]);

    const occupied = new Set(reservations.map((item) => item.roomId));
    const blocked = new Set(blocks.map((item) => item.roomId));
    const offers: AvailabilityOffer[] = [];
    const unavailable: AvailabilityResult["unavailable"] = [];

    for (const type of roomTypes) {
      const refuse = (reason: string, guestVisible = false) =>
        unavailable.push({ roomTypeId: type.id, roomTypeName: type.name, reason, guestVisible });

      if (type.capacity < guests) {
        refuse(`Capienza massima ${type.capacity} ospiti.`, true);
        continue;
      }

      const typeRooms = rooms.filter((room) => room.roomTypeId === type.id);
      const availableRooms = typeRooms
        .filter((room) => !blockedRoomStatuses.includes(room.status) && !occupied.has(room.id) && !blocked.has(room.id))
        .map((room) => ({ id: room.id, number: room.number }));

      if (!ctx.plans.length) {
        refuse("Nessuna tariffa attiva.");
        continue;
      }

      const evaluations = ctx.plans.map((plan) => ({
        plan,
        result: evaluateStay(ctx, type.id, plan, query.checkIn, query.checkOut),
      }));
      const ratePlans = evaluations.flatMap(({ plan, result }) =>
        result.ok
          ? [
              {
                id: plan.id,
                code: plan.code,
                name: plan.name,
                refundable: plan.isRefundable,
                nightly: result.nightly,
                total: result.total,
                minimumStay: result.minStay,
                nights: result.nights.map((night) => ({ date: night.date, price: night.price, season: night.season })),
              },
            ]
          : [],
      );

      if (!ratePlans.length) {
        const refusal = evaluations.find(({ result }) => !result.ok)?.result;
        if (refusal && !refusal.ok) refuse(refusal.reason, refusal.guestVisible);
        continue;
      }
      if (!availableRooms.length) {
        refuse(typeRooms.length ? "Nessuna camera libera per queste date." : "Nessuna camera attiva di questo tipo.", true);
        continue;
      }

      offers.push({
        roomTypeId: type.id,
        roomTypeName: type.name,
        capacity: type.capacity,
        availableRooms,
        remaining: availableRooms.length,
        ratePlans,
      });
    }

    return { offers, unavailable };
  },

  async assertRoomAvailable(input: {
    roomId: string;
    checkIn: string;
    checkOut: string;
    adults: number;
    children?: number;
    excludeReservationId?: string;
  }) {
    const room = await prisma.room.findUnique({ where: { id: input.roomId }, include: { roomType: true } });
    if (!room) throw new DomainError("La camera selezionata non esiste.");
    if (!room.active || !room.roomType.active) {
      throw new DomainError(`La camera ${room.number} non è disponibile per nuove prenotazioni.`);
    }
    if (blockedRoomStatuses.includes(room.status)) {
      throw new DomainError(`La camera ${room.number} non è disponibile: risulta in ${room.status === "OUT_OF_ORDER" ? "fuori servizio" : "manutenzione"}.`);
    }
    const guests = input.adults + (input.children ?? 0);
    if (guests > room.capacity) {
      throw new DomainError(`La camera ${room.number} accoglie al massimo ${room.capacity} ospiti.`);
    }
    const block = await prisma.roomBlock.findFirst({
      where: { roomId: room.id, ...blockOverlapWhere(input.checkIn, input.checkOut) },
      orderBy: { startDate: "asc" },
    });
    if (block) {
      throw new DomainError(
        `La camera ${room.number} è chiusa dal ${formatShort(toISODate(block.startDate))} al ${formatShort(toISODate(block.endDate))}${block.reason ? ` (${block.reason})` : ""}.`,
      );
    }
    const conflicts = await prisma.reservation.findMany({
      where: {
        roomId: input.roomId,
        status: { in: occupyingStatuses },
        checkIn: { lt: toDate(input.checkOut) },
        checkOut: { gt: toDate(input.checkIn) },
        ...(input.excludeReservationId ? { id: { not: input.excludeReservationId } } : {}),
      },
      include: { guest: true },
    });
    if (conflicts[0]) {
      const conflict = conflicts[0];
      throw new DomainError(
        `Impossibile spostare la prenotazione: la camera ${room.number} è occupata dal ${toISODate(conflict.checkIn)} al ${toISODate(conflict.checkOut)}${conflict.guest ? ` (${conflict.guest.lastName})` : ""}.`,
      );
    }
    return room;
  },
};
