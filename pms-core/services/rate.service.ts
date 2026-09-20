import { prisma } from "@pms-core/database/client";
import { DomainError } from "@pms-core/lib/errors";

export const rateService = {
  list(propertyId: string) {
    return prisma.ratePlan.findMany({
      where: { propertyId },
      include: { prices: { include: { roomType: true } } },
      orderBy: { name: "asc" },
    });
  },

  extras(propertyId: string) {
    return prisma.extra.findMany({ where: { propertyId, active: true }, orderBy: { name: "asc" } });
  },

  async updatePrice(ratePlanId: string, roomTypeId: string, basePrice: number) {
    if (basePrice < 0) throw new DomainError("Il prezzo non può essere negativo.");
    return prisma.ratePlanPrice.upsert({
      where: { ratePlanId_roomTypeId: { ratePlanId, roomTypeId } },
      update: { basePrice },
      create: { ratePlanId, roomTypeId, basePrice },
    });
  },
};
