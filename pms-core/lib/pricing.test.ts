import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  dailyRateKey,
  evaluateStay,
  inventoryKey,
  planPriceKey,
  type PricingContext,
  type PricingPlan,
  type PricingSeason,
} from "@pms-core/lib/pricing";

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

const natale: PricingSeason = {
  id: "s1",
  name: "Natale",
  ratePlanId: null,
  start: "2026-12-20",
  end: "2027-01-06",
  minStay: 3,
  maxStay: null,
  closedToArrival: false,
  closedToDeparture: false,
  prices: { std: 180 },
};

function context(overrides: Partial<PricingContext> = {}): PricingContext {
  return {
    roomTypes: new Map([
      ["std", { id: "std", name: "Standard", basePrice: 90 }],
      ["loft", { id: "loft", name: "Loft", basePrice: 0 }],
    ]),
    plans: [plan],
    planPrices: new Map([[planPriceKey("bar", "std"), 120]]),
    dailyRates: new Map(),
    inventory: new Map(),
    seasons: [natale],
    ...overrides,
  };
}

describe("evaluateStay", () => {
  it("uses the rate plan base price outside seasons", () => {
    const result = evaluateStay(context(), "std", plan, "2026-11-10", "2026-11-12");
    assert.ok(result.ok);
    assert.equal(result.total, 240);
    assert.deepEqual(
      result.nights.map((night) => night.source),
      ["plan", "plan"],
    );
  });

  it("prices each night on its own when a stay crosses into a season", () => {
    const result = evaluateStay(context(), "std", plan, "2026-12-18", "2026-12-22");
    assert.ok(result.ok);
    assert.deepEqual(
      result.nights.map((night) => night.price),
      [120, 120, 180, 180],
    );
    assert.equal(result.total, 600);
    assert.equal(result.minStay, 3);
  });

  it("applies the season minimum stay if any night touches the season", () => {
    const result = evaluateStay(context(), "std", plan, "2026-12-19", "2026-12-21");
    assert.equal(result.ok, false);
    assert.match(!result.ok ? result.reason : "", /Soggiorno minimo 3 notti \(Natale\)/);
    assert.equal(!result.ok && result.guestVisible, true);
  });

  it("keeps the base rules once the season is deleted", () => {
    const result = evaluateStay(context({ seasons: [] }), "std", plan, "2026-12-20", "2026-12-22");
    assert.ok(result.ok);
    assert.equal(result.total, 240);
  });

  it("refuses a stay over a night closed for sale", () => {
    const ctx = context({ inventory: new Map([[inventoryKey("std", "2026-11-11"), { closed: true, minStay: null, maxStay: null }]]) });
    const result = evaluateStay(ctx, "std", plan, "2026-11-10", "2026-11-13");
    assert.equal(result.ok, false);
    assert.match(!result.ok ? result.reason : "", /chiusa alla vendita/);
    assert.ok(evaluateStay(ctx, "std", plan, "2026-11-12", "2026-11-13").ok, "the next night stays sellable");
  });

  it("lets a day override beat the season and closes on Rate.closed", () => {
    const override = context({
      dailyRates: new Map([[dailyRateKey("bar", "std", "2026-12-24"), { price: 250, closed: false }]]),
    });
    const priced = evaluateStay(override, "std", plan, "2026-12-23", "2026-12-26");
    assert.ok(priced.ok);
    assert.deepEqual(
      priced.nights.map((night) => night.price),
      [180, 250, 180],
    );

    const closed = context({ dailyRates: new Map([[dailyRateKey("bar", "std", "2026-11-10"), { price: 0, closed: true }]]) });
    assert.equal(evaluateStay(closed, "std", plan, "2026-11-10", "2026-11-11").ok, false);
  });

  it("blocks arrival and departure days in closed seasons", () => {
    const cta = context({ seasons: [{ ...natale, minStay: null, closedToArrival: true }] });
    assert.equal(evaluateStay(cta, "std", plan, "2026-12-24", "2026-12-27").ok, false);
    assert.ok(evaluateStay(cta, "std", plan, "2026-12-18", "2026-12-21").ok, "arriving before the season is fine");

    const ctd = context({ seasons: [{ ...natale, minStay: null, closedToDeparture: true }] });
    const departing = evaluateStay(ctd, "std", plan, "2026-12-18", "2026-12-21");
    assert.equal(departing.ok, false);
    assert.match(!departing.ok ? departing.reason : "", /Partenza non consentita/);
  });

  it("ignores seasons that belong to another rate plan", () => {
    const ctx = context({ seasons: [{ ...natale, ratePlanId: "other" }] });
    const result = evaluateStay(ctx, "std", plan, "2026-12-24", "2026-12-25");
    assert.ok(result.ok);
    assert.equal(result.total, 120);
  });

  it("falls back to the room type base price, and refuses when nothing is priced", () => {
    const ctx = context({ planPrices: new Map() });
    const fallback = evaluateStay(ctx, "std", plan, "2026-11-10", "2026-11-11");
    assert.ok(fallback.ok);
    assert.equal(fallback.total, 90);

    const unpriced = evaluateStay(ctx, "loft", plan, "2026-11-10", "2026-11-11");
    assert.equal(unpriced.ok, false);
    assert.equal(!unpriced.ok && unpriced.guestVisible, false);
  });

  it("enforces the strictest maximum stay", () => {
    const ctx = context({ plans: [{ ...plan, maximumStay: 7 }], seasons: [{ ...natale, maxStay: 5, minStay: null }] });
    const result = evaluateStay(ctx, "std", { ...plan, maximumStay: 7 }, "2026-12-20", "2026-12-26");
    assert.equal(result.ok, false);
    assert.match(!result.ok ? result.reason : "", /Soggiorno massimo 5 notti/);
  });
});
