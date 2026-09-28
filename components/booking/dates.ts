import { addDaysISO } from "@pms-core/lib/dates";

import { todayISO } from "@/lib/booking";
import type { StayDates } from "@/components/booking/types";

export type StayDateErrors = {
  checkIn?: string;
  checkOut?: string;
};

/**
 * Controlli sulle date, usati sia dal campo sia dalla pagina /booking
 * (quella è un Server Component: questo file non ha "use client",
 * così può chiamarlo senza trascinare il componente nel server).
 *
 * todayISO è lo stesso del resto del sito: la data UTC, identica
 * nell'HTML del server e nel browser, così non c'è un salto al refresh.
 */
export function stayDateErrors(dates: StayDates, today = todayISO()): StayDateErrors {
  const errors: StayDateErrors = {};

  if (!dates.checkIn) {
    errors.checkIn = "Scegliete il check-in.";
  } else if (dates.checkIn < today) {
    errors.checkIn = "Il check-in non può essere una data passata.";
  }

  if (!dates.checkOut) {
    errors.checkOut = "Scegliete il check-out.";
  } else if (dates.checkOut < today) {
    errors.checkOut = "Il check-out non può essere una data passata.";
  } else if (dates.checkIn && dates.checkOut <= dates.checkIn) {
    errors.checkOut = "Il check-out deve essere successivo al check-in.";
  }

  return errors;
}

export function validateStayDates(dates: StayDates, today = todayISO()): string | null {
  const errors = stayDateErrors(dates, today);
  return errors.checkIn ?? errors.checkOut ?? null;
}

/** Se il check-in supera il check-out, sposta il check-out al giorno dopo. */
export function withCheckoutAfterCheckIn(dates: StayDates): StayDates {
  if (!dates.checkIn || !dates.checkOut || dates.checkOut > dates.checkIn) return dates;
  return { checkIn: dates.checkIn, checkOut: addDaysISO(dates.checkIn, 1) };
}
