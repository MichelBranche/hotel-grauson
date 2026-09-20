import { reservationRepo } from "@pms-core/database/repositories/reservation.repo";
import { roomRepo } from "@pms-core/database/repositories/room.repo";
import { toISODate } from "@pms-core/lib/dates";
import { guestDisplay } from "@pms-core/lib/utils";
import type { PlanningData, PlanningReservation } from "@pms-core/types";

const BLOCK_COLORS = ["#dce8dc", "#d7e4f2", "#f3dce3", "#efe6c9", "#e4ddd2", "#d9ebe4"];

function colorFor(id: string) {
  const index = id.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return BLOCK_COLORS[index % BLOCK_COLORS.length];
}

export const planningService = {
  async get(propertyId: string, from: string, to: string): Promise<PlanningData> {
    const [rooms, reservations] = await Promise.all([
      roomRepo.list(propertyId),
      reservationRepo.listInRange(propertyId, from, to),
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
        capacity: room.capacity,
        status: room.status,
        roomTypeId: room.roomTypeId,
        roomTypeName: room.roomType.name,
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
          color: colorFor(reservation.id),
        }),
      ),
    };
  },
};
