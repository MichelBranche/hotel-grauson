/**
 * Dati del modulo, tenuti nel browser.
 *
 * Alla ricerca e all'invio li traduciamo negli argomenti già previsti da
 * publicAvailabilityAction e publicCreateReservationAction.
 * Il consenso privacy resta solo qui: quell'action non ha un campo per salvarlo.
 */

export type StayDates = {
  checkIn: string;
  checkOut: string;
};

export type GuestCounts = {
  adults: number;
  children: number;
};

export type CustomerDetails = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  notes: string;
  privacyAccepted: boolean;
};

export const emptyCustomer: CustomerDetails = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  notes: "",
  privacyAccepted: false,
};

/** Adulti: lo stesso intervallo del vecchio selettore (1–6). */
export const ADULT_LIMITS = { min: 1, max: 6 } as const;

/** Bambini: lo stesso massimo accettato da publicAvailabilityAction. */
export const CHILD_LIMITS = { min: 0, max: 6 } as const;
