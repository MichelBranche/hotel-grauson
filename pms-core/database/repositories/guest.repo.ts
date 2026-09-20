import { prisma } from "@pms-core/database/client";

export const guestRepo = {
  list(propertyId: string) {
    return prisma.guest.findMany({
      where: { propertyId },
      include: {
        reservations: {
          orderBy: { checkIn: "desc" },
          take: 8,
        },
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });
  },

  get(id: string) {
    return prisma.guest.findUnique({
      where: { id },
      include: {
        reservations: {
          include: { room: true, payments: true },
          orderBy: { checkIn: "desc" },
        },
      },
    });
  },

  search(propertyId: string, query: string) {
    return prisma.guest.findMany({
      where: {
        propertyId,
        OR: [
          { firstName: { contains: query } },
          { lastName: { contains: query } },
          { email: { contains: query } },
        ],
      },
      take: 8,
      orderBy: { lastName: "asc" },
    });
  },
};
