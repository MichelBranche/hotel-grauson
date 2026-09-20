import type { Prisma, ReservationStatus } from "@prisma/client";

import { occupyingStatuses } from "@pms-core/config/status";
import { prisma } from "@pms-core/database/client";
import { toDate } from "@pms-core/lib/dates";

const detailInclude = {
  guest: true,
  room: { include: { roomType: true } },
  roomType: true,
  ratePlan: true,
  payments: { orderBy: { createdAt: "desc" as const } },
  extras: { include: { extra: true } },
  guests: { include: { guest: true } },
} satisfies Prisma.ReservationInclude;

export const reservationRepo = {
  detailInclude,

  findById(id: string) {
    return prisma.reservation.findUnique({ where: { id }, include: detailInclude });
  },

  findByCode(code: string) {
    return prisma.reservation.findUnique({ where: { code }, include: detailInclude });
  },

  listInRange(propertyId: string, from: string, to: string, statuses?: ReservationStatus[]) {
    return prisma.reservation.findMany({
      where: {
        propertyId,
        checkIn: { lt: toDate(to) },
        checkOut: { gt: toDate(from) },
        ...(statuses ? { status: { in: statuses } } : {}),
      },
      include: {
        guest: true,
        room: true,
        roomType: true,
      },
      orderBy: { checkIn: "asc" },
    });
  },

  overlapping(roomId: string, checkIn: string, checkOut: string, excludeId?: string) {
    return prisma.reservation.findMany({
      where: {
        roomId,
        status: { in: occupyingStatuses },
        checkIn: { lt: toDate(checkOut) },
        checkOut: { gt: toDate(checkIn) },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      include: { guest: true },
    });
  },
};
