import type { ReservationStatus } from "@prisma/client";

import { reservationStatusMeta } from "@pms-core/config/status";

/**
 * Planning bars follow reservation status, not guest identity or payment.
 * Pastel fills keep guest names readable with dark text.
 */
const STATUS_COLORS: Record<ReservationStatus, string> = {
  INQUIRY: "#e4ddd2",
  OPTION: "#f0dfb0",
  CONFIRMED: "#cfe3d1",
  CHECKED_IN: "#c5daf0",
  CHECKED_OUT: "#f0d4de",
  CANCELLED: "#e8d0d0",
  NO_SHOW: "#d9d4cf",
};

/** Statuses that usually appear on the board (cancelled / no-show stay hidden). */
export const PLANNING_COLOR_LEGEND: ReservationStatus[] = ["OPTION", "CONFIRMED", "CHECKED_IN", "CHECKED_OUT", "INQUIRY"];

export function planningColor(status: ReservationStatus) {
  return STATUS_COLORS[status];
}

export function planningBarTextColor() {
  return "#263229";
}

export function planningLegendItems() {
  return PLANNING_COLOR_LEGEND.map((status) => ({
    status,
    label: reservationStatusMeta[status].label,
    color: STATUS_COLORS[status],
  }));
}
