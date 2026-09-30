import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { documentAuditAfter } from "@pms-core/lib/check-in-audit";
import {
  checkInGuestComplete,
  companionGuestComplete,
  documentLast4,
  parseCheckInGuest,
  parseCheckInParty,
} from "@pms-core/lib/check-in-guest";

const document = { documentType: "CI", documentNumber: "CA12345678", documentCountry: "IT" };

describe("check-in guest", () => {
  it("requires name, phone, country, and a document on the primary guest", () => {
    assert.equal(
      checkInGuestComplete({ firstName: "Ada", lastName: "Lovelace", phone: "320", country: "IT", email: null, ...document }),
      true,
    );
    assert.equal(
      checkInGuestComplete({ firstName: "Ada", lastName: "Lovelace", phone: "320", country: "IT", email: null }),
      false,
    );
    assert.equal(checkInGuestComplete({ firstName: "Ada", lastName: "Lovelace", email: "ada@example.com", ...document }), false);
  });

  it("keeps email optional and does not echo the document number in errors", () => {
    const parsed = parseCheckInGuest({
      firstName: " Ada ",
      lastName: " Lovelace ",
      phone: " 320 ",
      country: " IT ",
      email: "  ",
      documentType: "PASSPORT",
      documentNumber: " YA1234567 ",
      documentExpiresOn: "",
    });
    assert.equal(parsed.email, null);
    assert.equal(parsed.documentNumber, "YA1234567");
    assert.equal(parsed.documentExpiresOn, null);
    assert.throws(() => parseCheckInGuest({ firstName: "Ada", lastName: "Lovelace", phone: "320", country: "IT" }), (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.match(error.message, /documento/);
      assert.equal(error.message.includes("YA1234567"), false);
      return true;
    });
  });

  it("requires name, country, and a document for other guests, not a phone", () => {
    assert.equal(companionGuestComplete({ firstName: "Grace", lastName: "Hopper", country: "US", ...document }), true);
    assert.equal(companionGuestComplete({ firstName: "Grace", lastName: "Hopper", country: "US", phone: "333" }), false);
  });

  it("refuses more companions than the room count", () => {
    const companion = { firstName: "Grace", lastName: "Hopper", country: "US", ...document };
    assert.throws(
      () => parseCheckInParty({ primary: { firstName: "Ada", lastName: "Lovelace", phone: "320", country: "IT", ...document }, companions: [companion], partySize: 1 }),
      /composizione della camera/,
    );
  });

  it("records a short document reference, not the full number", () => {
    const stamp = documentAuditAfter("CI", "CA12345678");
    assert.equal(stamp.documentLast4, "5678");
    assert.equal(stamp.documentRef.length, 8);
    assert.equal(JSON.stringify(stamp).includes("CA12345678"), false);
    assert.equal(documentLast4("CA12345678"), "5678");
    assert.equal(documentAuditAfter("CI", "A123").documentLast4, null);
  });
});
