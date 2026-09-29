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

function accountInput(
  emailKey: string,
  firstKey: string,
  lastKey: string,
  defaults: { email: string; firstName: string; lastName: string },
) {
  const email = (process.env[emailKey] || defaults.email).trim().toLowerCase();
  const firstName = (process.env[firstKey] || defaults.firstName).trim();
  const lastName = (process.env[lastKey] || defaults.lastName).trim();
  if (!email.includes("@")) {
    throw new Error(`Set ${emailKey} to a login email.`);
  }
  return { email, firstName, lastName };
}

export function developerSeedInput() {
  return accountInput("SEED_DEVELOPER_EMAIL", "SEED_DEVELOPER_FIRST_NAME", "SEED_DEVELOPER_LAST_NAME", {
    email: "developer@grauson.local",
    firstName: "Developer",
    lastName: "Grauson",
  });
}

export function ownerSeedInput() {
  return accountInput("SEED_OWNER_EMAIL", "SEED_OWNER_FIRST_NAME", "SEED_OWNER_LAST_NAME", {
    email: "info@locandagrauson.it",
    firstName: "Locanda",
    lastName: "Grauson",
  });
}

/** Temporary password from the environment. Never log the value. Required only when that user does not exist yet. */
export function requireSeedPassword(envName: "SEED_DEVELOPER_PASSWORD" | "SEED_OWNER_PASSWORD") {
  const password = process.env[envName] ?? "";
  if (!password || password === PASSWORD_PLACEHOLDER || password.length < 8) {
    throw new Error(`Set ${envName} to a temporary password of at least 8 characters. Change it after the first login.`);
  }
  return password;
}

/** Temporary owner password from the environment. Never log the value. */
export function requireOwnerPassword() {
  return requireSeedPassword("SEED_OWNER_PASSWORD");
}
