import type { Prisma } from "@prisma/client";

import { prisma } from "@pms-core/database/client";

type AuditInput = {
  propertyId: string;
  userId?: string | null;
  action: string;
  entity: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
  tx?: Prisma.TransactionClient;
};

export const auditService = {
  async record(input: AuditInput) {
    const db = input.tx ?? prisma;
    return db.auditLog.create({
      data: {
        propertyId: input.propertyId,
        userId: input.userId ?? null,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId,
        before: input.before === undefined ? null : JSON.stringify(input.before),
        after: input.after === undefined ? null : JSON.stringify(input.after),
      },
    });
  },

  list(propertyId: string, entityId?: string) {
    return prisma.auditLog.findMany({
      where: { propertyId, ...(entityId ? { entityId } : {}) },
      include: { user: true },
      orderBy: { createdAt: "desc" },
      take: 80,
    });
  },
};
