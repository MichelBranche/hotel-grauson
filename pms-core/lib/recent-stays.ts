import { reservationStatusMeta } from "@pms-core/config/status";
import { toISODate } from "@pms-core/lib/dates";

export type RecentStay = {
  id: string;
  code: string;
  status: keyof typeof reservationStatusMeta;
  total: number;
  currency: string;
  checkIn: string;
  guest: { firstName: string; lastName: string };
};

export const RECENT_LIMIT = 4;

export function toRecentStays(
  rows: {
    id: string;
    code: string;
    status: RecentStay["status"];
    total: number;
    currency: string;
    checkIn: Date;
    guest: { firstName: string; lastName: string };
  }[],
): RecentStay[] {
  return rows.slice(0, RECENT_LIMIT).map((row) => ({
    id: row.id,
    code: row.code,
    status: row.status,
    total: row.total,
    currency: row.currency,
    checkIn: toISODate(row.checkIn),
    guest: { firstName: row.guest.firstName, lastName: row.guest.lastName },
  }));
}

export function planningFocusHref(stay: Pick<RecentStay, "id" | "checkIn">) {
  return `/pms/planning?${new URLSearchParams({ focus: stay.id, date: stay.checkIn })}`;
}
