import { prisma } from "@pms-core/database/client";
import { DomainError } from "@pms-core/lib/errors";
import { addDaysISO, eachISODate, toDate, toISODate } from "@pms-core/lib/dates";
import {
  dailyRateKey,
  describeNight,
  evaluateStay,
  inventoryKey,
  planPriceKey,
  type NightInfo,
  type PricingContext,
  type PricingPlan,
  type StayQuote,
} from "@pms-core/lib/pricing";

/**
 * Loads everything needed to price nights from `from` to `to` (inclusive, so the
 * departure day's closed-to-departure rule is visible).
 */
export async function loadPricingContext(propertyId: string, from: string, to: string): Promise<PricingContext> {
  const nightStart = toDate(from);
  const nightEnd = toDate(addDaysISO(to, 1));
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: {
      roomTypes: { select: { id: true, name: true, basePrice: true } },
      ratePlans: {
        where: { active: true },
        orderBy: { createdAt: "asc" },
        include: {
          prices: true,
          rates: { where: { date: { gte: nightStart, lt: nightEnd } } },
        },
      },
      rateSeasons: {
        where: { startDate: { lte: toDate(to) }, endDate: { gte: nightStart } },
        include: { prices: true },
      },
      inventory: { where: { date: { gte: nightStart, lt: nightEnd } } },
    },
  });
  if (!property) throw new DomainError("Struttura non trovata.");
  const roomTypes = property.roomTypes;
  const plans = property.ratePlans;
  const planPrices = plans.flatMap((plan) => plan.prices);
  const dailyRates = plans.flatMap((plan) => plan.rates);
  const inventory = property.inventory;
  const seasons = property.rateSeasons;

  return {
    roomTypes: new Map(roomTypes.map((type) => [type.id, type])),
    plans: plans.map(toPricingPlan),
    planPrices: new Map(planPrices.map((row) => [planPriceKey(row.ratePlanId, row.roomTypeId), row.basePrice])),
    dailyRates: new Map(
      dailyRates.map((row) => [dailyRateKey(row.ratePlanId, row.roomTypeId, toISODate(row.date)), { price: row.price, closed: row.closed }]),
    ),
    inventory: new Map(
      inventory.map((row) => [
        inventoryKey(row.roomTypeId, toISODate(row.date)),
        { closed: row.closed, minStay: row.minStay, maxStay: row.maxStay },
      ]),
    ),
    seasons: seasons.map((season) => ({
      id: season.id,
      name: season.name,
      ratePlanId: season.ratePlanId,
      start: toISODate(season.startDate),
      end: toISODate(season.endDate),
      minStay: season.minStay,
      maxStay: season.maxStay,
      closedToArrival: season.closedToArrival,
      closedToDeparture: season.closedToDeparture,
      prices: Object.fromEntries(season.prices.map((price) => [price.roomTypeId, price.price])),
    })),
  };
}

function toPricingPlan(plan: {
  id: string;
  code: string;
  name: string;
  isRefundable: boolean;
  minimumStay: number;
  maximumStay: number | null;
  closedToArrival: boolean;
  closedToDeparture: boolean;
}): PricingPlan {
  return {
    id: plan.id,
    code: plan.code,
    name: plan.name,
    isRefundable: plan.isRefundable,
    minimumStay: plan.minimumStay,
    maximumStay: plan.maximumStay,
    closedToArrival: plan.closedToArrival,
    closedToDeparture: plan.closedToDeparture,
  };
}

export const pricingService = {
  /**
   * Price a stay with the same rules as availability search. Without a rate plan
   * the first sellable active plan is used. Throws with the reason when the stay
   * cannot be sold.
   */
  async quoteStay(input: {
    propertyId: string;
    roomTypeId: string;
    ratePlanId?: string;
    checkIn: string;
    checkOut: string;
  }): Promise<StayQuote & { plan: PricingPlan }> {
    const ctx = await loadPricingContext(input.propertyId, input.checkIn, input.checkOut);
    const candidates = input.ratePlanId ? ctx.plans.filter((plan) => plan.id === input.ratePlanId) : ctx.plans;
    if (input.ratePlanId && !candidates.length) {
      throw new DomainError("La tariffa selezionata non è attiva.");
    }
    if (!candidates.length) {
      throw new DomainError("Nessuna tariffa attiva: crea un piano tariffario in Tariffe.");
    }
    let firstRefusal: string | null = null;
    for (const plan of candidates) {
      const result = evaluateStay(ctx, input.roomTypeId, plan, input.checkIn, input.checkOut);
      if (result.ok) return { ...result, plan };
      firstRefusal ??= result.reason;
    }
    throw new DomainError(firstRefusal ?? "Soggiorno non disponibile.");
  },

  /** Resolved price and rules per room type and night, for the rate calendar. */
  async calendar(propertyId: string, ratePlanId: string, from: string, days: number) {
    const to = addDaysISO(from, days - 1);
    const ctx = await loadPricingContext(propertyId, from, to);
    const plan = ctx.plans.find((item) => item.id === ratePlanId);
    if (!plan) return null;
    const dates = eachISODate(from, addDaysISO(to, 1));
    const types = await prisma.roomType.findMany({
      where: { propertyId, active: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true },
    });
    return {
      plan,
      dates,
      rows: types.map((type) => ({
        roomTypeId: type.id,
        roomTypeName: type.name,
        nights: dates.map((date): NightInfo => describeNight(ctx, type.id, plan, date)),
      })),
    };
  },
};
