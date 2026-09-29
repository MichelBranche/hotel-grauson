import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { evaluateStay, planPriceKey, type PricingContext, type PricingPlan } from "@pms-core/lib/pricing";
import { repriceStay } from "@pms-core/lib/reservation-quote";

const plan: PricingPlan = {
  id: "bar",
  code: "BAR",
  name: "Standard",
  isRefundable: true,
  minimumStay: 1,
  maximumStay: null,
  closedToArrival: false,
  closedToDeparture: false,
};

const context: PricingContext = {
  roomTypes: new Map([["std", { id: "std", name: "Standard", basePrice: 90 }]]),
  plans: [plan],
  planPrices: new Map([[planPriceKey("bar", "std"), 120]]),
  dailyRates: new Map(),
  inventory: new Map(),
  seasons: [
    {
      id: "natale",
      name: "Natale",
      ratePlanId: null,
      start: "2026-12-20",
      end: "2027-01-06",
      minStay: 3,
      maxStay: null,
      closedToArrival: false,
      closedToDeparture: false,
      prices: { std: 180 },
    },
  ],
};

const extras = [
  { extraId: "breakfast", quantity: 2, unitPrice: 15, perNight: true },
  { extraId: "parking", quantity: 1, unitPrice: 10, perNight: false },
];

describe("reprice on modify", () => {
  it("changes the total when the stay is extended into a season", () => {
    const before = evaluateStay(context, "std", plan, "2026-12-18", "2026-12-20");
    const after = evaluateStay(context, "std", plan, "2026-12-18", "2026-12-22");
    assert.ok(before.ok);
    assert.ok(after.ok);
    assert.equal(before.total, 240);
    assert.equal(after.total, 600);

    const short = repriceStay(before.total, before.nights.length, extras, 0.1);
    const extended = repriceStay(after.total, after.nights.length, extras, 0.1);

    assert.equal(short.roomRate, 240);
    assert.equal(short.extrasTotal, 70);
    assert.equal(short.total, 341);
    assert.equal(extended.roomRate, 600);
    assert.equal(extended.extras.find((line) => line.extraId === "breakfast")?.total, 120);
    assert.equal(extended.extras.find((line) => line.extraId === "parking")?.total, 10);
    assert.equal(extended.extrasTotal, 130);
    assert.equal(extended.taxesTotal, 73);
    assert.equal(extended.total, 803);
    assert.notEqual(extended.total, short.total);
  });

  it("keeps a one-off extra when only the room rate changes", () => {
    const stay = evaluateStay(context, "std", plan, "2026-12-22", "2026-12-25");
    assert.ok(stay.ok);
    assert.equal(stay.total, 540);
    const priced = repriceStay(stay.total, stay.nights.length, [{ extraId: "parking", quantity: 1, unitPrice: 10, perNight: false }], 0);
    assert.equal(priced.extrasTotal, 10);
    assert.equal(priced.total, 550);
  });
});
