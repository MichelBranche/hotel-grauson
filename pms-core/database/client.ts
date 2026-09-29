import { PrismaClient } from "@prisma/client";

/**
 * Supabase session mode (pooler port 5432) caps clients at pool_size. Each
 * serverless isolate that opens the default Prisma pool fills that cap and the
 * next save waits. The app uses the transaction pooler instead. Prisma CLI
 * migrations keep the original DATABASE_URL.
 */
function runtimeDatabaseUrl(configured: string | undefined) {
  if (!configured) return configured;
  let parsed: URL;
  try {
    parsed = new URL(configured.replace(/^postgres(ql)?:/, "http:"));
  } catch {
    return configured;
  }

  const direct = /^db\.([a-z0-9]+)\.supabase\.co$/i.exec(parsed.hostname);
  if (direct) {
    parsed.hostname = "aws-0-eu-west-2.pooler.supabase.com";
    parsed.port = "6543";
    if (parsed.username === "postgres") parsed.username = `postgres.${direct[1]}`;
  } else if (parsed.hostname.endsWith(".pooler.supabase.com") && (parsed.port === "5432" || parsed.port === "")) {
    parsed.port = "6543";
  } else {
    return configured;
  }

  if (!parsed.searchParams.has("pgbouncer")) parsed.searchParams.set("pgbouncer", "true");
  if (!parsed.searchParams.has("connection_limit")) parsed.searchParams.set("connection_limit", "1");
  return parsed.toString().replace(/^http:/, "postgresql:");
}

const databaseUrl = runtimeDatabaseUrl(process.env.DATABASE_URL);
if (databaseUrl) process.env.DATABASE_URL = databaseUrl;

const globalForPrisma = globalThis as unknown as { pmsPrisma?: PrismaClient };

export const prisma =
  globalForPrisma.pmsPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

globalForPrisma.pmsPrisma = prisma;
