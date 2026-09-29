import type { ReservationStatus, RoomStatus } from "@prisma/client";

import { occupyingStatuses, reservationStatusMeta } from "@pms-core/config/status";
import { addDaysISO, nightsBetween } from "@pms-core/lib/dates";
import { DomainError } from "@pms-core/lib/errors";

const ALLOWED: Record<ReservationStatus, ReservationStatus[]> = {
  INQUIRY: ["OPTION", "CONFIRMED", "CANCELLED"],
  OPTION: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["CHECKED_IN", "CANCELLED", "NO_SHOW"],
  CHECKED_IN: ["CHECKED_OUT"],
  CHECKED_OUT: [],
  CANCELLED: [],
  NO_SHOW: [],
};

const TERMINAL: ReservationStatus[] = ["CHECKED_OUT", "CANCELLED", "NO_SHOW"];

export function canModifyStay(status: ReservationStatus) {
  return status === "INQUIRY" || occupyingStatuses.includes(status);
}

export type DeskAction = "confirm" | "option" | "check-in" | "modify" | "cancel" | "no-show" | "check-out" | "extra" | "payment";

/** Primary actions shown for the current status. The server transition table is still the authority. */
export function actionsFor(status: ReservationStatus): DeskAction[] {
  switch (status) {
    case "INQUIRY":
      return ["confirm", "option", "modify", "cancel"];
    case "OPTION":
      return ["confirm", "modify", "cancel"];
    case "CONFIRMED":
      return ["check-in", "modify", "cancel", "no-show"];
    case "CHECKED_IN":
      return ["check-out", "extra", "payment"];
    default:
      return [];
  }
}

export function assertStatusTransition(
  from: ReservationStatus,
  to: ReservationStatus,
  options?: { forceCancel?: boolean; reason?: string },
) {
  if (from === to) {
    throw new DomainError(`La prenotazione è già «${reservationStatusMeta[from].label}».`);
  }
  if (ALLOWED[from].includes(to)) return;
  if (from === "CHECKED_IN" && to === "CANCELLED" && options?.forceCancel) {
    if ((options.reason?.trim().length ?? 0) < 3) {
      throw new DomainError("Per annullare un soggiorno già iniziato indica un motivo (almeno 3 caratteri).");
    }
    return;
  }
  if (from === "CHECKED_IN" && to === "CANCELLED") {
    throw new DomainError(
      "Un ospite già in casa non si può cancellare. Fai prima il check-out, oppure un titolare o un amministratore può forzare l'annullamento indicando il motivo.",
    );
  }
  if (TERMINAL.includes(from)) {
    throw new DomainError(`«${reservationStatusMeta[from].label}» è uno stato definitivo: si possono aggiornare solo le note.`);
  }
  throw new DomainError(
    `Passaggio non consentito: da «${reservationStatusMeta[from].label}» non si può andare a «${reservationStatusMeta[to].label}».`,
  );
}

export function assertCancellationReason(reason: string | undefined) {
  if ((reason?.trim().length ?? 0) < 3) {
    throw new DomainError("Indica un motivo di cancellazione (almeno 3 caratteri).");
  }
  return reason!.trim();
}

export function checkInBlockMessage(room: { number: string; status: RoomStatus }): string | null {
  if (room.status === "OUT_OF_ORDER") return `Check-in non possibile: la camera ${room.number} è fuori servizio.`;
  if (room.status === "OUT_OF_SERVICE") return `Check-in non possibile: la camera ${room.number} è in manutenzione.`;
  return null;
}

/**
 * Early departure frees the unused nights. The charged total stays as agreed:
 * checkout is not a reprice, so a minimum-stay rule cannot block it.
 * `today` is the property's calendar date.
 */
export function earlyCheckout(checkIn: string, checkOut: string, today: string) {
  if (today > checkIn && today < checkOut) {
    return { checkOut: today, nights: nightsBetween(checkIn, today), shortened: true };
  }
  const firstNight = addDaysISO(checkIn, 1);
  if (today <= checkIn && checkOut > firstNight) {
    return { checkOut: firstNight, nights: 1, shortened: true };
  }
  return { checkOut, nights: nightsBetween(checkIn, checkOut), shortened: false };
}

export function appendReservationNote(notes: string, line: string) {
  const base = notes.trim();
  return base ? `${base}\n${line}` : line;
}
