import { roundMoney } from "@pms-core/lib/money";

export type ExtraToPrice = {
  id?: string;
  extraId: string;
  quantity: number;
  unitPrice: number;
  perNight: boolean;
};

export type PricedStay = {
  nights: number;
  roomRate: number;
  extrasTotal: number;
  taxesTotal: number;
  total: number;
  extras: (ExtraToPrice & { total: number })[];
};

/**
 * Room rate comes from the pricing engine. Extras keep the unit price stored on
 * the booking: per-night extras scale with the new length, one-off extras stay.
 * Tax is a percentage of room + extras, same formula as create.
 */
export function repriceStay(roomRate: number, nights: number, extras: ExtraToPrice[], taxRate: number): PricedStay {
  const lines = extras.map((line) => ({
    ...line,
    total: roundMoney(line.unitPrice * line.quantity * (line.perNight ? nights : 1)),
  }));
  const extrasTotal = roundMoney(lines.reduce((sum, line) => sum + line.total, 0));
  const rate = roundMoney(roomRate);
  const taxesTotal = roundMoney((rate + extrasTotal) * taxRate);
  return {
    nights,
    roomRate: rate,
    extrasTotal,
    taxesTotal,
    total: roundMoney(rate + extrasTotal + taxesTotal),
    extras: lines,
  };
}
