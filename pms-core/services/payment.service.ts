import { prisma } from "@pms-core/database/client";

export const paymentService = {
  list(propertyId: string) {
    return prisma.payment.findMany({
      where: { reservation: { propertyId } },
      include: { reservation: { include: { guest: true, room: true } } },
      orderBy: { createdAt: "desc" },
    });
  },
};
