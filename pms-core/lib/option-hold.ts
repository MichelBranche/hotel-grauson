import { createHash, timingSafeEqual } from "node:crypto";

/** Hours an OPTION may hold inventory before the cron releases it. */
export const OPTION_HOLD_HOURS_DEFAULT = 48;

/** Fixed cancellation reason. The existing status path appends it to the notes. */
export const OPTION_EXPIRE_REASON = "Scadenza automatica opzione";

const HOUR_MS = 3_600_000;

/**
 * `OPTION_HOLD_HOURS` overrides the default. Missing or invalid values stay on 48
 * so a bad env cannot cancel every option at once.
 */
export function optionHoldMs(raw: string | undefined = process.env.OPTION_HOLD_HOURS) {
  const parsed = Number(raw);
  if (raw == null || raw.trim() === "" || !Number.isFinite(parsed) || parsed <= 0) {
    return OPTION_HOLD_HOURS_DEFAULT * HOUR_MS;
  }
  return parsed * HOUR_MS;
}

export function optionExpiresAt(createdAt: Date, holdMs = optionHoldMs()) {
  return new Date(createdAt.getTime() + holdMs);
}

export function optionHoldCutoff(now = new Date(), holdMs = optionHoldMs()) {
  return new Date(now.getTime() - holdMs);
}

export function formatOptionExpiry(expiresAt: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("it-IT", {
    timeZone,
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(expiresAt);
  const pick = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  const month = pick("month").replace(/\.$/, "");
  return `Scade il ${pick("day")} ${month} alle ${pick("hour")}:${pick("minute")}`;
}

/** Label for an open option that still has time left. Property timezone. */
export function optionExpiryLabel(input: {
  status: string;
  createdAt: Date;
  timeZone: string;
  now?: Date;
  holdMs?: number;
}) {
  if (input.status !== "OPTION") return null;
  const now = input.now ?? new Date();
  const expiresAt = optionExpiresAt(input.createdAt, input.holdMs);
  if (expiresAt.getTime() <= now.getTime()) return null;
  return formatOptionExpiry(expiresAt, input.timeZone);
}

/** Vercel cron sends `Authorization: Bearer $CRON_SECRET`. */
export function cronAuthorized(authorization: string | null, secret: string | undefined) {
  if (!secret) return false;
  const token = authorization?.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : "";
  const actual = createHash("sha256").update(token).digest();
  const expected = createHash("sha256").update(secret).digest();
  return timingSafeEqual(actual, expected);
}
