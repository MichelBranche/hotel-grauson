import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { documentAuditAfter } from "@pms-core/lib/check-in-audit";
import {
  checkInGuestComplete,
  companionGuestComplete,
  documentLast4,
  isItalyResidence,
  parseCheckInCompanion,
  parseCheckInGuest,
  parseCheckInParty,
  type CheckInGuestFields,
} from "@pms-core/lib/check-in-guest";

function person(overrides: CheckInGuestFields = {}): CheckInGuestFields {
  return {
    firstName: "Ada",
    lastName: "Lovelace",
    sex: "F",
    dateOfBirth: "1990-12-10",
    birthPlace: "Londra",
    citizenship: "GB",
    residenceAddress: "Via Roma 1",
    residenceCity: "Aosta",
    residencePostalCode: "11100",
    residenceProvince: "AO",
    residenceCountry: "IT",
    documentType: "CI",
    documentNumber: "CA12345678",
    documentAuthority: "Comune di Aosta",
    documentIssuedOn: "2020-01-15",
    documentExpiresOn: "2030-01-15",
    documentCountry: "IT",
    ...overrides,
  };
}

describe("check-in guest", () => {
  it("does not require phone or email", () => {
    assert.equal(checkInGuestComplete(person({ phone: "", email: "" })), true);
    assert.equal(checkInGuestComplete(person({ phone: null, email: null })), true);
  });

  it("requires anagrafica, residence, and document", () => {
    assert.equal(checkInGuestComplete(person({ birthPlace: " " })), false);
    assert.equal(checkInGuestComplete(person({ sex: "" })), false);
    assert.equal(checkInGuestComplete(person({ residenceAddress: "" })), false);
    assert.equal(checkInGuestComplete(person({ documentAuthority: "" })), false);
    assert.equal(checkInGuestComplete(person({ documentCountry: "" })), false);
  });

  it("requires CAP and province only for an Italian residence", () => {
    assert.equal(isItalyResidence("Italia"), true);
    assert.equal(isItalyResidence("ita"), true);
    assert.equal(checkInGuestComplete(person({ residencePostalCode: "", residenceProvince: "" })), false);
    assert.equal(
      checkInGuestComplete(person({ residenceCountry: "FR", residenceCity: "Lione", residencePostalCode: "", residenceProvince: "" })),
      true,
    );
  });

  it("requires expiry for identity card, passport, and licence", () => {
    assert.equal(checkInGuestComplete(person({ documentExpiresOn: "" })), false);
    assert.equal(checkInGuestComplete(person({ documentType: "PASSPORT", documentExpiresOn: "" })), false);
    assert.equal(checkInGuestComplete(person({ documentType: "OTHER", documentExpiresOn: "" })), true);
  });

  it("keeps phone optional and does not echo personal data in errors", () => {
    const parsed = parseCheckInGuest(person({ phone: "  ", email: "  ", residenceProvince: " ao " }));
    assert.equal(parsed.phone, null);
    assert.equal(parsed.email, null);
    assert.equal(parsed.residenceProvince, "ao");
    assert.throws(() => parseCheckInGuest(person({ documentNumber: "", documentExpiresOn: "" })), (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.equal(error.message.includes("CA12345678"), false);
      assert.equal(error.message.includes("Via Roma"), false);
      return true;
    });
  });

  it("asks companions only for name, sex, and residence", () => {
    const light = {
      firstName: "Grace",
      lastName: "Hopper",
      sex: "F",
      residenceAddress: "Rue de la Paix 1",
      residenceCity: "Lione",
      residenceCountry: "Francia",
    };
    assert.equal(companionGuestComplete(light), true);
    assert.equal(companionGuestComplete({ ...light, residenceCountry: "IT" }), false);
    const parsed = parseCheckInCompanion(light);
    assert.equal(parsed.residenceCountry, "FR");
    assert.equal(parsed.dateOfBirth, null);
    assert.equal(parsed.documentNumber, null);
    assert.throws(() => parseCheckInParty({ primary: person(), companions: [], partySize: 2 }), /tutti gli ospiti/);
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
