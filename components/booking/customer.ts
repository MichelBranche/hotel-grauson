import type { CustomerDetails } from "@/components/booking/types";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const NOTES_MAX = 500;

export type CustomerField = keyof CustomerDetails;

export const customerFieldOrder: CustomerField[] = [
  "firstName",
  "lastName",
  "email",
  "phone",
  "notes",
  "privacyAccepted",
];

/**
 * Controlli nel browser, prima dell'invio.
 * Il server action ha già i suoi controlli: questi servono a parlare
 * in italiano, senza aspettare il giro di rete.
 */
export function customerErrors(value: CustomerDetails): Partial<Record<CustomerField, string>> {
  const errors: Partial<Record<CustomerField, string>> = {};
  const firstName = value.firstName.trim();
  const lastName = value.lastName.trim();

  if (!firstName) errors.firstName = "Inserite il nome.";
  else if (firstName.length < 2) errors.firstName = "Il nome deve avere almeno due lettere.";

  if (!lastName) errors.lastName = "Inserite il cognome.";
  else if (lastName.length < 2) errors.lastName = "Il cognome deve avere almeno due lettere.";

  if (!EMAIL.test(value.email.trim())) errors.email = "Inserite un indirizzo email valido.";

  const digits = value.phone.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15) {
    errors.phone = "Inserite un numero di telefono valido, anche con prefisso.";
  }

  if (value.notes.trim().length > NOTES_MAX) {
    errors.notes = `Le note possono avere al massimo ${NOTES_MAX} caratteri.`;
  }

  if (!value.privacyAccepted) {
    errors.privacyAccepted = "Per inviare la richiesta serve il consenso al trattamento dei dati.";
  }

  return errors;
}

export function firstCustomerError(errors: Partial<Record<CustomerField, string>>): CustomerField | null {
  return customerFieldOrder.find((field) => errors[field]) ?? null;
}
