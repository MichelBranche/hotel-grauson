import { addDaysISO, startOfIsoWeek, todayInTimeZone } from "@pms-core/lib/dates";

/**
 * Fresh Planning opens on the calendar week (Monday–Sunday) that contains
 * today in the property timezone. The 2-week and month zooms stay available
 * once the board is open.
 */
export const PLANNING_OPEN_SPAN = 7;

export function planningOpenFrom(timeZone: string, now = new Date()): string {
  return startOfIsoWeek(todayInTimeZone(timeZone, now));
}

export function planningOpenRange(timeZone: string, now = new Date()) {
  const from = planningOpenFrom(timeZone, now);
  return { from, to: addDaysISO(from, PLANNING_OPEN_SPAN) };
}
