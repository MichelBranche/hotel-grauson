import { reservationRepo } from "@pms-core/database/repositories/reservation.repo";
import { roomRepo } from "@pms-core/database/repositories/room.repo";
import { prisma } from "@pms-core/database/client";
import { planningStatuses } from "@pms-core/config/status";
import { toDate, toISODate } from "@pms-core/lib/dates";
import { guestDisplay } from "@pms-core/lib/utils";
import { planningColor } from "@pms-core/lib/planning-color";
import type { PlanningData, PlanningReservation } from "@pms-core/types";

export const planningService = {
  async get(propertyId: string, from: string, to: string): Promise<PlanningData> {
    const [rooms, reservations, blocks, closed] = await Promise.all([
      roomRepo.listForPlanning(propertyId, from, to),
      reservationRepo.listInRange(propertyId, from, to, planningStatuses),
      prisma.roomBlock.findMany({
        where: { propertyId, startDate: { lt: toDate(to) }, endDate: { gte: toDate(from) } },
        orderBy: { startDate: "asc" },
      }),
      prisma.inventory.findMany({
        where: { propertyId, closed: true, date: { gte: toDate(from), lt: toDate(to) } },
        select: { roomTypeId: true, date: true },
      }),
    ]);

    return {
      propertyId,
      from,
      to,
      rooms: rooms.map((room) => ({
        id: room.id,
        number: room.number,
        name: room.name,
        floor: room.floor,
        floorId: room.floorId,
        floorName: room.assignedFloor?.displayName ?? null,
        capacity: room.capacity,
        status: room.status,
        roomTypeId: room.roomTypeId,
        roomTypeName: room.roomType.name,
        active: room.active,
      })),
      reservations: reservations.map(
        (reservation): PlanningReservation => ({
          id: reservation.id,
          code: reservation.code,
          roomId: reservation.roomId,
          roomNumber: reservation.room.number,
          roomTypeName: reservation.roomType.name,
          guestId: reservation.guestId,
          guestName: guestDisplay(reservation.guest.firstName, reservation.guest.lastName),
          guestFirstName: reservation.guest.firstName,
          guestLastName: reservation.guest.lastName,
          ratePlanId: reservation.ratePlanId,
          email: reservation.guest.email,
          phone: reservation.guest.phone,
          adults: reservation.adults,
          children: reservation.children,
          checkIn: toISODate(reservation.checkIn),
          checkOut: toISODate(reservation.checkOut),
          nights: reservation.nights,
          status: reservation.status,
          total: reservation.total,
          currency: reservation.currency,
          notes: reservation.notes,
          vip: reservation.vip,
          color: planningColor(reservation.id),
        }),
      ),
      blocks: blocks.map((block) => ({
        id: block.id,
        roomId: block.roomId,
        startDate: toISODate(block.startDate),
        endDate: toISODate(block.endDate),
        reason: block.reason,
      })),
      closedNights: closed.map((row) => ({ roomTypeId: row.roomTypeId, date: toISODate(row.date) })),
    };
  },
};
