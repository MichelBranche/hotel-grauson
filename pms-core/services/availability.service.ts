import { blockedRoomStatuses, occupyingStatuses } from "@pms-core/config/status";
import { prisma } from "@pms-core/database/client";
import { DomainError } from "@pms-core/lib/errors";
import { eachISODate, nightsBetween, toDate, toISODate } from "@pms-core/lib/dates";
import { roundMoney } from "@pms-core/lib/money";
import type { AvailabilityOffer } from "@pms-core/types";

type AvailabilityQuery = {
  propertyId: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children?: number;
  roomTypeId?: string;
  excludeReservationId?: string;
};

export const availabilityService = {
  async search(query: AvailabilityQuery): Promise<AvailabilityOffer[]> {
    const nights = nightsBetween(query.checkIn, query.checkOut);
    if (nights < 1) {
      throw new DomainError("La data di check-out deve essere successiva al check-in.");
    }

    const guests = query.adults + (query.children ?? 0);
    const dates = eachISODate(query.checkIn, query.checkOut);

    const [roomTypes, rooms, reservations, inventory, prices, dailyRates] = await Promise.all([
      prisma.roomType.findMany({
        where: {
          propertyId: query.propertyId,
          ...(query.roomTypeId ? { id: query.roomTypeId } : {}),
        },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.room.findMany({
        where: {
          propertyId: query.propertyId,
          ...(query.roomTypeId ? { roomTypeId: query.roomTypeId } : {}),
        },
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
      prisma.inventory.findMany({
        where: {
          propertyId: query.propertyId,
          date: { gte: toDate(query.checkIn), lt: toDate(query.checkOut) },
        },
      }),
      prisma.ratePlanPrice.findMany({
        include: { ratePlan: true },
      }),
      prisma.rate.findMany({
        where: {
          date: { gte: toDate(query.checkIn), lt: toDate(query.checkOut) },
        },
      }),
    ]);

    const occupied = new Set(reservations.map((item) => item.roomId));
    const closed = new Set(
      inventory.filter((row) => row.closed).map((row) => `${row.roomTypeId}:${toISODate(row.date)}`),
    );

    return roomTypes
      .filter((type) => type.capacity >= guests)
      .map((type) => {
        const typeRooms = rooms.filter(
          (room) =>
            room.roomTypeId === type.id &&
            !blockedRoomStatuses.includes(room.status) &&
            !occupied.has(room.id),
        );
        const blockedByInventory = dates.some((date) => closed.has(`${type.id}:${date}`));
        const availableRooms = blockedByInventory ? [] : typeRooms.map((room) => ({ id: room.id, number: room.number }));

        const ratePlans = prices
          .filter((price) => price.roomTypeId === type.id && price.ratePlan.active && price.ratePlan.propertyId === query.propertyId)
          .filter((price) => nights >= price.ratePlan.minimumStay)
          .filter((price) => !price.ratePlan.maximumStay || nights <= price.ratePlan.maximumStay)
          .filter((price) => !price.ratePlan.closedToArrival)
          .map((price) => {
            const nightly = dates.reduce((sum, date) => {
              const override = dailyRates.find(
                (rate) =>
                  rate.ratePlanId === price.ratePlanId &&
                  rate.roomTypeId === type.id &&
                  toISODate(rate.date) === date,
              );
              if (override?.closed) return sum;
              return sum + (override?.price ?? price.basePrice);
            }, 0);
            return {
              id: price.ratePlan.id,
              code: price.ratePlan.code,
              name: price.ratePlan.name,
              refundable: price.ratePlan.isRefundable,
              nightly: roundMoney(nightly / nights),
              total: roundMoney(nightly),
              minimumStay: price.ratePlan.minimumStay,
            };
          })
          .filter((plan) => plan.total > 0);

        return {
          roomTypeId: type.id,
          roomTypeName: type.name,
          capacity: type.capacity,
          availableRooms,
          remaining: availableRooms.length,
          ratePlans,
        };
      })
      .filter((offer) => offer.remaining > 0 && offer.ratePlans.length > 0);
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
    if (blockedRoomStatuses.includes(room.status)) {
      throw new DomainError(`La camera ${room.number} non è disponibile: risulta in ${room.status === "OUT_OF_ORDER" ? "fuori servizio" : "manutenzione"}.`);
    }
    const guests = input.adults + (input.children ?? 0);
    if (guests > room.capacity) {
      throw new DomainError(`La camera ${room.number} accoglie al massimo ${room.capacity} ospiti.`);
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
