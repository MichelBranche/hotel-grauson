import type { ReservationStatus } from "@prisma/client";

import { isPayAtPropertyRequest } from "@pms-core/lib/pay-at-property";

export type TodayStay = {
  id: string;
  code: string;
  status: ReservationStatus;
  checkIn: string;
  checkOut: string;
  guestName: string;
  roomNumber: string;
  source: string;
  notes: string;
};

const closed = new Set<ReservationStatus>(["CANCELLED", "NO_SHOW"]);

function byRoom(a: TodayStay, b: TodayStay) {
  return a.roomNumber.localeCompare(b.roomNumber, "it", { numeric: true }) || a.code.localeCompare(b.code);
}

/** Reception lists for one property calendar day. Dates are YYYY-MM-DD. */
export function todayDesk(stays: TodayStay[], today: string) {
  const arrivals = stays
    .filter((stay) => stay.checkIn === today && !closed.has(stay.status) && stay.status !== "CHECKED_OUT")
    .sort(byRoom);
  const departures = stays.filter((stay) => stay.checkOut === today && !closed.has(stay.status)).sort(byRoom);
  const inHouse = stays.filter((stay) => stay.status === "CHECKED_IN").sort(byRoom);
  const webRequests = stays
    .filter((stay) => isPayAtPropertyRequest(stay))
    .sort((a, b) => a.checkIn.localeCompare(b.checkIn) || byRoom(a, b));
  return { arrivals, departures, inHouse, webRequests };
}
