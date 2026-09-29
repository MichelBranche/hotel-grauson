import { existsSync } from "node:fs";
import path from "node:path";

const PASSWORD_PLACEHOLDER = "replace-with-a-temporary-password";

/** Load the repo-root .env when present. Existing process env wins. */
export function loadLocalEnv() {
  const envPath = path.resolve(process.cwd(), ".env");
  if (existsSync(envPath)) {
    process.loadEnvFile(envPath);
  }
}

export function assertPostgresUrl() {
  const url = process.env.DATABASE_URL ?? "";
  if (!url.startsWith("postgres://") && !url.startsWith("postgresql://")) {
    throw new Error(
      "DATABASE_URL must be the Supabase Postgres session URI. SQLite file URLs are not supported.",
    );
  }
}

export function ownerSeedInput() {
  const email = (process.env.SEED_OWNER_EMAIL || "owner@grauson.local").trim().toLowerCase();
  const firstName = (process.env.SEED_OWNER_FIRST_NAME || "Owner").trim();
  const lastName = (process.env.SEED_OWNER_LAST_NAME || "Grauson").trim();
  if (!email.includes("@")) {
    throw new Error("Set SEED_OWNER_EMAIL to the owner login email.");
  }
  return { email, firstName, lastName };
}

/** Temporary owner password from the environment. Never log the value. */
export function requireOwnerPassword() {
  const password = process.env.SEED_OWNER_PASSWORD ?? "";
  if (!password || password === PASSWORD_PLACEHOLDER || password.length < 8) {
    throw new Error(
      "Set SEED_OWNER_PASSWORD to a temporary password of at least 8 characters. Change it after the first login.",
    );
  }
  return password;
}
