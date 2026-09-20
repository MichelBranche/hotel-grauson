import { prisma } from "@pms-core/database/client";
import { guestDisplay } from "@pms-core/lib/utils";

export const searchService = {
  async query(propertyId: string, term: string) {
    const q = term.trim();
    if (q.length < 2) return { guests: [], reservations: [], rooms: [] };

    const [guests, reservations, rooms] = await Promise.all([
      prisma.guest.findMany({
        where: {
          propertyId,
          OR: [{ firstName: { contains: q } }, { lastName: { contains: q } }, { email: { contains: q } }],
        },
        take: 6,
      }),
      prisma.reservation.findMany({
        where: {
          propertyId,
          OR: [
            { code: { contains: q } },
            { guest: { lastName: { contains: q } } },
            { guest: { firstName: { contains: q } } },
          ],
        },
        include: { guest: true, room: true },
        take: 6,
      }),
      prisma.room.findMany({
        where: {
          propertyId,
          OR: [{ number: { contains: q } }, { name: { contains: q } }, { roomType: { name: { contains: q } } }],
        },
        include: { roomType: true },
        take: 6,
      }),
    ]);

    return {
      guests: guests.map((guest) => ({
        id: guest.id,
        label: guestDisplay(guest.firstName, guest.lastName),
        href: `/pms/guests/${guest.id}`,
        hint: guest.email ?? "Ospite",
      })),
      reservations: reservations.map((reservation) => ({
        id: reservation.id,
        label: reservation.code,
        href: `/pms/reservations/${reservation.id}`,
        hint: `${guestDisplay(reservation.guest.firstName, reservation.guest.lastName)} · camera ${reservation.room.number}`,
      })),
      rooms: rooms.map((room) => ({
        id: room.id,
        label: `Camera ${room.number}`,
        href: `/pms/rooms/${room.id}`,
        hint: room.roomType.name,
      })),
    };
  },
};
