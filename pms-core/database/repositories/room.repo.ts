import type { Prisma, RoomStatus } from "@prisma/client";

import { prisma } from "@pms-core/database/client";
import { toDate } from "@pms-core/lib/dates";

export type RoomListFilters = {
  floorId?: string;
  roomTypeId?: string;
  status?: RoomStatus;
  active?: boolean;
  query?: string;
};

const roomDetailInclude = {
  roomType: true,
  assignedFloor: true,
  reservations: {
    include: { guest: true },
    orderBy: { checkIn: "desc" as const },
    take: 16,
  },
  housekeepingTasks: {
    include: { assignee: true },
    orderBy: { updatedAt: "desc" as const },
    take: 4,
  },
} satisfies Prisma.RoomInclude;

export const roomRepo = {
  list(propertyId: string, filters: RoomListFilters = {}) {
    const query = filters.query?.trim();
    return prisma.room.findMany({
      where: {
        propertyId,
        ...(filters.floorId ? { floorId: filters.floorId } : {}),
        ...(filters.roomTypeId ? { roomTypeId: filters.roomTypeId } : {}),
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.active === undefined ? {} : { active: filters.active }),
        ...(query
          ? {
              OR: [
                { number: { contains: query } },
                { name: { contains: query } },
              ],
            }
          : {}),
      },
      include: { roomType: true, assignedFloor: true },
      orderBy: [{ floor: "asc" }, { sortOrder: "asc" }, { number: "asc" }],
    });
  },

  listForPlanning(propertyId: string, from: string, to: string) {
    return prisma.room.findMany({
      where: {
        propertyId,
        OR: [
          { active: true },
          {
            reservations: {
              some: {
                checkIn: { lt: toDate(to) },
                checkOut: { gt: toDate(from) },
              },
            },
          },
        ],
      },
      include: { roomType: true, assignedFloor: true },
      orderBy: [{ floor: "asc" }, { sortOrder: "asc" }, { number: "asc" }],
    });
  },

  get(id: string) {
    return prisma.room.findUnique({
      where: { id },
      include: roomDetailInclude,
    });
  },

  types(propertyId: string, filters: { query?: string; active?: boolean } = {}) {
    const query = filters.query?.trim();
    return prisma.roomType.findMany({
      where: {
        propertyId,
        ...(filters.active === undefined ? {} : { active: filters.active }),
        ...(query
          ? {
              OR: [{ name: { contains: query } }, { code: { contains: query } }],
            }
          : {}),
      },
      include: {
        _count: { select: { rooms: true, reservations: true } },
        ratePrices: { include: { ratePlan: true } },
      },
      orderBy: { sortOrder: "asc" },
    });
  },

  type(id: string) {
    return prisma.roomType.findUnique({
      where: { id },
      include: {
        rooms: { include: { assignedFloor: true }, orderBy: { number: "asc" } },
        ratePrices: { include: { ratePlan: true } },
        _count: { select: { rooms: true, reservations: true } },
      },
    });
  },

  floors(propertyId: string) {
    return prisma.floor.findMany({
      where: { propertyId },
      include: { _count: { select: { rooms: true } } },
      orderBy: { sortOrder: "asc" },
    });
  },
};
