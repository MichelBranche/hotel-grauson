import type { ReservationStatus } from "@prisma/client";

import { reservationStatusMeta } from "@pms-core/config/status";

const SHORT_STATUS: Record<ReservationStatus, string> = {
  INQUIRY: "Richiesta",
  OPTION: "Opzione",
  CONFIRMED: "Conf.",
  CHECKED_IN: "In casa",
  CHECKED_OUT: "Uscito",
  CANCELLED: "Canc.",
  NO_SHOW: "No-show",
};

function nightsLabel(nights: number) {
  return nights === 1 ? "1 notte" : `${nights} notti`;
}

function statusLabel(status: ReservationStatus, payAtProperty?: boolean) {
  if (status === "OPTION" && payAtProperty) return "Richiesta web";
  return reservationStatusMeta[status].label;
}

function shortStatus(status: ReservationStatus, payAtProperty?: boolean) {
  if (status === "OPTION" && payAtProperty) return "Web";
  return SHORT_STATUS[status];
}

/** Hover text: full name, code, status, and nights. The bar itself stays clipped to its dates. */
export function planningBarTitle(input: {
  guestName: string;
  code: string;
  nights: number;
  status: ReservationStatus;
  payAtProperty?: boolean;
  vip?: boolean;
}) {
  const name = input.guestName.trim() || input.code;
  const vip = input.vip ? " · VIP" : "";
  return `${name} · ${input.code} · ${statusLabel(input.status, input.payAtProperty)} · ${nightsLabel(input.nights)}${vip}`;
}

/**
 * One line, chosen from the pixels left for text.
 * Short bars keep the surname and a short status so they do not collapse into several ellipses.
 */
export function planningBarLabel(input: {
  guestName: string;
  guestLastName: string;
  nights: number;
  status: ReservationStatus;
  payAtProperty?: boolean;
  textWidth: number;
}) {
  const last = input.guestLastName.trim() || input.guestName.trim();
  const name = input.guestName.trim() || last;
  if (input.textWidth < 56) return last;
  if (input.textWidth < 108) return `${last} · ${shortStatus(input.status, input.payAtProperty)}`;
  if (input.textWidth < 200) return `${name} · ${nightsLabel(input.nights)}`;
  return `${name} · ${nightsLabel(input.nights)} · ${statusLabel(input.status, input.payAtProperty)}`;
}
