import { eachISODate, formatShort } from "@pms-core/lib/dates";
import { roundMoney } from "@pms-core/lib/money";

/**
 * Single source of truth for "can this stay be sold, and at what price".
 * Pure: the service layer loads a PricingContext from the database and every
 * caller (PMS search, PMS create, public booking, rate calendar) evaluates here.
 *
 * Nightly price, first match wins:
 *   1. Rate row (rate plan + room type + date): manual day override
 *   2. Season covering the night with a price for the room type
 *   3. RatePlanPrice (base price of the rate plan for the room type)
 *   4. RoomType.basePrice, if > 0
 *
 * Stay rules, strictest wins across every night of the stay:
 *   min stay = max(rate plan, season, Inventory.minStay)
 *   max stay = min(rate plan, season, Inventory.maxStay)
 * Arrival/departure: a season with closedToArrival blocks check-in on its nights,
 * closedToDeparture blocks check-out on its nights.
 * Closures: Inventory.closed on any night closes the room type; Rate.closed
 * closes that rate plan for the room type.
 */

export type PricingPlan = {
  id: string;
  code: string;
  name: string;
  isRefundable: boolean;
  minimumStay: number;
  maximumStay: number | null;
  closedToArrival: boolean;
  closedToDeparture: boolean;
};

export type PricingSeason = {
  id: string;
  name: string;
  ratePlanId: string | null;
  start: string;
  end: string;
  minStay: number | null;
  maxStay: number | null;
  closedToArrival: boolean;
  closedToDeparture: boolean;
  prices: Record<string, number>;
};

export type PricingContext = {
  roomTypes: Map<string, { id: string; name: string; basePrice: number }>;
  plans: PricingPlan[];
  planPrices: Map<string, number>;
  dailyRates: Map<string, { price: number; closed: boolean }>;
  inventory: Map<string, { closed: boolean; minStay: number | null; maxStay: number | null }>;
  seasons: PricingSeason[];
};

export type PriceSource = "rate" | "season" | "plan" | "type";

export type NightPrice = { date: string; price: number; source: PriceSource; season: string | null };

export type StayRefusal = {
  ok: false;
  reason: string;
  /** Safe to show to website guests (stay rules), as opposed to setup problems. */
  guestVisible: boolean;
};

export type StayQuote = {
  ok: true;
  nights: NightPrice[];
  total: number;
  nightly: number;
  minStay: number;
  maxStay: number | null;
};

export type StayEvaluation = StayQuote | StayRefusal;

export type NightInfo = {
  date: string;
  price: number | null;
  source: PriceSource | null;
  season: string | null;
  minStay: number;
  maxStay: number | null;
  closed: boolean;
  closedToArrival: boolean;
  closedToDeparture: boolean;
};

export const planPriceKey = (planId: string, roomTypeId: string) => `${planId}:${roomTypeId}`;
export const dailyRateKey = (planId: string, roomTypeId: string, date: string) => `${planId}:${roomTypeId}:${date}`;
export const inventoryKey = (roomTypeId: string, date: string) => `${roomTypeId}:${date}`;

/** Seasons never overlap within a scope, so at most one plan-specific and, if none, one all-plans season matches. */
export function seasonFor(ctx: PricingContext, planId: string, date: string): PricingSeason | null {
  let general: PricingSeason | null = null;
  for (const season of ctx.seasons) {
    if (date < season.start || date > season.end) continue;
    if (season.ratePlanId === planId) return season;
    if (season.ratePlanId === null) general = season;
  }
  return general;
}

function nightPrice(ctx: PricingContext, roomTypeId: string, planId: string, date: string) {
  const season = seasonFor(ctx, planId, date);
  const override = ctx.dailyRates.get(dailyRateKey(planId, roomTypeId, date));
  if (override) return { price: override.price, source: "rate" as const, season, closed: override.closed };
  const seasonal = season?.prices[roomTypeId];
  if (seasonal !== undefined) return { price: seasonal, source: "season" as const, season, closed: false };
  const base = ctx.planPrices.get(planPriceKey(planId, roomTypeId));
  if (base !== undefined) return { price: base, source: "plan" as const, season, closed: false };
  const typeBase = ctx.roomTypes.get(roomTypeId)?.basePrice ?? 0;
  if (typeBase > 0) return { price: typeBase, source: "type" as const, season, closed: false };
  return { price: null, source: null, season, closed: false };
}

export function describeNight(ctx: PricingContext, roomTypeId: string, plan: PricingPlan, date: string): NightInfo {
  const resolved = nightPrice(ctx, roomTypeId, plan.id, date);
  const inventory = ctx.inventory.get(inventoryKey(roomTypeId, date));
  const season = resolved.season;
  const maxCandidates = [plan.maximumStay, season?.maxStay ?? null, inventory?.maxStay ?? null].filter(
    (value): value is number => value !== null && value > 0,
  );
  return {
    date,
    price: resolved.price,
    source: resolved.source,
    season: season?.name ?? null,
    minStay: Math.max(plan.minimumStay, season?.minStay ?? 1, inventory?.minStay ?? 1, 1),
    maxStay: maxCandidates.length ? Math.min(...maxCandidates) : null,
    closed: Boolean(inventory?.closed) || resolved.closed,
    closedToArrival: plan.closedToArrival || Boolean(season?.closedToArrival),
    closedToDeparture: plan.closedToDeparture || Boolean(season?.closedToDeparture),
  };
}

export function evaluateStay(
  ctx: PricingContext,
  roomTypeId: string,
  plan: PricingPlan,
  checkIn: string,
  checkOut: string,
): StayEvaluation {
  const dates = eachISODate(checkIn, checkOut);
  const typeName = ctx.roomTypes.get(roomTypeId)?.name ?? "camera";

  for (const date of dates) {
    if (ctx.inventory.get(inventoryKey(roomTypeId, date))?.closed) {
      return { ok: false, reason: `${typeName}: chiusa alla vendita il ${formatShort(date)}.`, guestVisible: false };
    }
  }

  if (plan.closedToArrival) {
    return { ok: false, reason: `Tariffa ${plan.name}: arrivi chiusi.`, guestVisible: false };
  }
  const arrivalSeason = seasonFor(ctx, plan.id, checkIn);
  if (arrivalSeason?.closedToArrival) {
    return {
      ok: false,
      reason: `Arrivo non consentito il ${formatShort(checkIn)} (${arrivalSeason.name}).`,
      guestVisible: true,
    };
  }
  if (plan.closedToDeparture) {
    return { ok: false, reason: `Tariffa ${plan.name}: partenze chiuse.`, guestVisible: false };
  }
  const departureSeason = seasonFor(ctx, plan.id, checkOut);
  if (departureSeason?.closedToDeparture) {
    return {
      ok: false,
      reason: `Partenza non consentita il ${formatShort(checkOut)} (${departureSeason.name}).`,
      guestVisible: true,
    };
  }

  const nights: NightPrice[] = [];
  let minStay = 1;
  let minStaySource: string | null = null;
  let maxStay: number | null = null;
  let maxStaySource: string | null = null;

  for (const date of dates) {
    const info = describeNight(ctx, roomTypeId, plan, date);
    if (info.closed) {
      return { ok: false, reason: `Tariffa ${plan.name} chiusa il ${formatShort(date)} per ${typeName}.`, guestVisible: false };
    }
    if (info.price === null) {
      return { ok: false, reason: `Prezzo non impostato per ${typeName} (${plan.name}) il ${formatShort(date)}.`, guestVisible: false };
    }
    if (info.price < 0) {
      return { ok: false, reason: `Prezzo non valido per ${typeName} il ${formatShort(date)}.`, guestVisible: false };
    }
    if (info.minStay > minStay) {
      minStay = info.minStay;
      minStaySource = info.season;
    }
    if (info.maxStay !== null && (maxStay === null || info.maxStay < maxStay)) {
      maxStay = info.maxStay;
      maxStaySource = info.season;
    }
    nights.push({ date, price: info.price, source: info.source ?? "type", season: info.season });
  }

  if (dates.length < minStay) {
    return {
      ok: false,
      reason: `Soggiorno minimo ${minStay} notti${minStaySource ? ` (${minStaySource})` : ""}.`,
      guestVisible: true,
    };
  }
  if (maxStay !== null && dates.length > maxStay) {
    return {
      ok: false,
      reason: `Soggiorno massimo ${maxStay} notti${maxStaySource ? ` (${maxStaySource})` : ""}.`,
      guestVisible: true,
    };
  }

  const total = roundMoney(nights.reduce((sum, night) => sum + night.price, 0));
  return { ok: true, nights, total, nightly: roundMoney(total / Math.max(dates.length, 1)), minStay, maxStay };
}
