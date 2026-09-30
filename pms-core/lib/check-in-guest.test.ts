import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { checkInGuestComplete, parseCheckInGuest } from "@pms-core/lib/check-in-guest";

describe("check-in guest", () => {
  it("treats name, phone, and country as enough for a direct confirm", () => {
    assert.equal(
      checkInGuestComplete({ firstName: "Ada", lastName: "Lovelace", phone: "320", country: "IT", email: null }),
      true,
    );
    assert.equal(checkInGuestComplete({ firstName: "Ada", lastName: "Lovelace", email: "ada@example.com" }), false);
    assert.equal(
      checkInGuestComplete({ firstName: " Ada ", lastName: "Lovelace", phone: " ", country: "IT" }),
      false,
    );
  });

  it("keeps email optional and trims the required fields", () => {
    assert.deepEqual(
      parseCheckInGuest({ firstName: " Ada ", lastName: " Lovelace ", phone: " 320 ", country: " IT ", email: "  " }),
      { firstName: "Ada", lastName: "Lovelace", phone: "320", country: "IT", email: null },
    );
    assert.throws(
      () => parseCheckInGuest({ firstName: "Ada", lastName: "Lovelace", email: "ada@example.com" }),
      /telefono e paese/,
    );
  });
});
