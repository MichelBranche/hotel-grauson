import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  cronAuthorized,
  OPTION_HOLD_HOURS_DEFAULT,
  optionExpiryLabel,
  optionExpiresAt,
  optionHoldCutoff,
  optionHoldMs,
} from "@pms-core/lib/option-hold";

const HOUR_MS = 3_600_000;

describe("option hold", () => {
  it("keeps 48 hours unless OPTION_HOLD_HOURS is a positive number", () => {
    assert.equal(optionHoldMs(undefined), OPTION_HOLD_HOURS_DEFAULT * HOUR_MS);
    assert.equal(optionHoldMs(""), OPTION_HOLD_HOURS_DEFAULT * HOUR_MS);
    assert.equal(optionHoldMs("no"), OPTION_HOLD_HOURS_DEFAULT * HOUR_MS);
    assert.equal(optionHoldMs("0"), OPTION_HOLD_HOURS_DEFAULT * HOUR_MS);
    assert.equal(optionHoldMs("-2"), OPTION_HOLD_HOURS_DEFAULT * HOUR_MS);
    assert.equal(optionHoldMs("24"), 24 * HOUR_MS);
  });

  it("expires 48 hours after createdAt", () => {
    const createdAt = new Date("2026-09-27T10:00:00.000Z");
    const holdMs = 48 * HOUR_MS;
    assert.equal(optionExpiresAt(createdAt, holdMs).toISOString(), "2026-09-29T10:00:00.000Z");
    assert.equal(optionHoldCutoff(new Date("2026-09-29T10:00:00.000Z"), holdMs).toISOString(), createdAt.toISOString());
  });

  it("labels an open option in the property timezone and hides the rest", () => {
    const createdAt = new Date("2026-09-27T10:00:00.000Z");
    const holdMs = 48 * HOUR_MS;
    const now = new Date("2026-09-28T10:00:00.000Z");
    assert.equal(
      optionExpiryLabel({ status: "OPTION", createdAt, timeZone: "Europe/Rome", now, holdMs }),
      "Scade il 29 set alle 12:00",
    );
    assert.equal(
      optionExpiryLabel({ status: "OPTION", createdAt, timeZone: "Europe/Rome", now: new Date("2026-09-29T10:00:00.000Z"), holdMs }),
      null,
    );
    assert.equal(optionExpiryLabel({ status: "CONFIRMED", createdAt, timeZone: "Europe/Rome", now, holdMs }), null);
    assert.equal(optionExpiryLabel({ status: "CANCELLED", createdAt, timeZone: "Europe/Rome", now, holdMs }), null);
  });

  it("accepts only the bearer cron secret", () => {
    assert.equal(cronAuthorized("Bearer segreto", "segreto"), true);
    assert.equal(cronAuthorized("Bearer altro", "segreto"), false);
    assert.equal(cronAuthorized(null, "segreto"), false);
    assert.equal(cronAuthorized("Bearer segreto", undefined), false);
    assert.equal(cronAuthorized("segreto", "segreto"), false);
  });
});
