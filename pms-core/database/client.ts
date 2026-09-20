import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { pmsPrisma?: PrismaClient };

export const prisma =
  globalForPrisma.pmsPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.pmsPrisma = prisma;
}
