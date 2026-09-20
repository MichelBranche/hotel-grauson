import { PrismaClient } from "@prisma/client";

import { resolveDatabaseUrl } from "@pms-core/database/runtime";

const globalForPrisma = globalThis as unknown as { pmsPrisma?: PrismaClient };
const databaseUrl = resolveDatabaseUrl();

export const prisma =
  globalForPrisma.pmsPrisma ??
  new PrismaClient({
    datasources: { db: { url: databaseUrl } },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

globalForPrisma.pmsPrisma = prisma;
