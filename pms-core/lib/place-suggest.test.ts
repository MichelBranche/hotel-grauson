import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { normalizeCountry } from "@pms-core/data/countries";
import { countryHits, normalizeProvince, rankPlaceHits } from "@pms-core/lib/place-suggest";

describe("place suggestions", () => {
  it("normalizes Italy and ranks prefix matches first", () => {
    assert.equal(normalizeCountry("Italia"), "IT");
    assert.equal(normalizeCountry("francia"), "FR");
    assert.equal(normalizeCountry("Atlantide"), "Atlantide");
    const hits = countryHits("ita");
    assert.equal(hits[0]?.value, "IT");
    assert.equal(normalizeProvince("Aosta"), "Aosta");
    assert.equal(normalizeProvince("ao"), "AO");
  });

  it("prefers a prefix over a later contains match", () => {
    const hits = rankPlaceHits("rom", [
      { label: "Andorra", value: "AD" },
      { label: "Romania", value: "RO" },
      { label: "San Marino", value: "SM" },
    ]);
    assert.equal(hits[0]?.value, "RO");
  });
});
