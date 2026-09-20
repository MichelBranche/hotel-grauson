import { prisma } from "@pms-core/database/client";

export const roomRepo = {
  list(propertyId: string) {
    return prisma.room.findMany({
      where: { propertyId },
      include: { roomType: true },
      orderBy: [{ floor: "asc" }, { sortOrder: "asc" }, { number: "asc" }],
    });
  },

  get(id: string) {
    return prisma.room.findUnique({ where: { id }, include: { roomType: true } });
  },

  types(propertyId: string) {
    return prisma.roomType.findMany({
      where: { propertyId },
      include: { _count: { select: { rooms: true } } },
      orderBy: { sortOrder: "asc" },
    });
  },
};
