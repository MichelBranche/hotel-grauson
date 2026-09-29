import type { z } from "zod";

export type RoomTypeView = { id: string; name: string; code: string; basePrice: number; active: boolean };

export type PlanView = {
  id: string;
  code: string;
  name: string;
  description: string;
  cancellationPolicy: string;
  depositPercent: number;
  minimumStay: number;
  maximumStay: number | null;
  isRefundable: boolean;
  active: boolean;
  reservationCount: number;
  prices: Record<string, number>;
};

export type SeasonView = {
  id: string;
  name: string;
  ratePlanId: string | null;
  ratePlanName: string | null;
  startDate: string;
  endDate: string;
  minStay: number | null;
  maxStay: number | null;
  closedToArrival: boolean;
  closedToDeparture: boolean;
  notes: string;
  prices: Record<string, number>;
};

export function issuesByField(error: z.ZodError) {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    out[key] ??= issue.message;
  }
  return out;
}

/** "" stays empty (null); accepts Italian decimal commas. */
export function numberOrNull(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  return Number(trimmed.replace(",", "."));
}

export function numberText(value: number | null | undefined) {
  return value === null || value === undefined ? "" : String(value);
}
