import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { developerSeedInput, ownerSeedInput, requireSeedPassword } from "./env";

const KEYS = [
  "SEED_DEVELOPER_EMAIL",
  "SEED_DEVELOPER_FIRST_NAME",
  "SEED_DEVELOPER_LAST_NAME",
  "SEED_DEVELOPER_PASSWORD",
  "SEED_OWNER_EMAIL",
  "SEED_OWNER_FIRST_NAME",
  "SEED_OWNER_LAST_NAME",
  "SEED_OWNER_PASSWORD",
] as const;

function withoutSeedEnv(run: () => void) {
  const previous = new Map(KEYS.map((key) => [key, process.env[key]]));
  for (const key of KEYS) delete process.env[key];
  try {
    run();
  } finally {
    for (const [key, value] of previous) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

describe("seed accounts", () => {
  it("defaults the developer and the hotel owner", () => {
    withoutSeedEnv(() => {
      assert.deepEqual(developerSeedInput(), {
        email: "developer@grauson.local",
        firstName: "Developer",
        lastName: "Grauson",
      });
      assert.deepEqual(ownerSeedInput(), {
        email: "info@locandagrauson.it",
        firstName: "Locanda",
        lastName: "Grauson",
      });
    });
  });

  it("rejects a missing or short password", () => {
    withoutSeedEnv(() => {
      assert.throws(() => requireSeedPassword("SEED_OWNER_PASSWORD"), /SEED_OWNER_PASSWORD/);
      process.env.SEED_DEVELOPER_PASSWORD = "short";
      assert.throws(() => requireSeedPassword("SEED_DEVELOPER_PASSWORD"), /at least 8/);
      process.env.SEED_DEVELOPER_PASSWORD = "replace-with-a-temporary-password";
      assert.throws(() => requireSeedPassword("SEED_DEVELOPER_PASSWORD"), /SEED_DEVELOPER_PASSWORD/);
    });
  });
});
