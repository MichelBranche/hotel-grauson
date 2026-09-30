import { DomainError } from "@pms-core/lib/errors";

/**
 * Check-in fields already stored on Guest.
 * Email is reviewed for the primary guest and is not required.
 * Document number, phone, and email are high-sensitivity PII: do not put them in URLs,
 * toasts, logs, or audit payloads. Rows stay on Guest for reception; Alloggiati export is out of scope.
 */

export const DOCUMENT_TYPES = [
  { value: "CI", label: "Carta d'identità" },
  { value: "PASSPORT", label: "Passaporto" },
  { value: "LICENSE", label: "Patente" },
  { value: "OTHER", label: "Altro" },
] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number]["value"];

export type StayGuestSummary = {
  id: string;
  firstName: string;
  lastName: string;
  isPrimary: boolean;
  documentType: string | null;
  documentLast4: string | null;
};

export type CheckInGuestFields = {
  id?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  country?: string | null;
  documentType?: string | null;
  documentNumber?: string | null;
  documentCountry?: string | null;
  documentExpiresOn?: string | null;
};

export type CheckInDocument = {
  documentType: DocumentType;
  documentNumber: string;
  documentCountry: string | null;
  documentExpiresOn: string | null;
};

export type CheckInGuest = CheckInDocument & {
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string;
  country: string;
};

export type CheckInCompanion = CheckInDocument & {
  id?: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  country: string;
};

function filled(value: string | null | undefined) {
  return Boolean(value?.trim());
}

export function knownDocumentType(value: string | null | undefined): DocumentType | null {
  const found = DOCUMENT_TYPES.find((item) => item.value === value);
  return found ? found.value : null;
}

export function documentTypeLabel(value: string | null | undefined) {
  return DOCUMENT_TYPES.find((item) => item.value === value)?.label ?? "Documento";
}

/** Last four characters for display and audit. Shorter numbers stay hidden. */
export function documentLast4(number: string | null | undefined) {
  const compact = number?.replace(/\s+/g, "") ?? "";
  if (compact.length < 8) return null;
  return compact.slice(-4);
}

export function maskedDocument(last4: string | null | undefined) {
  return last4 ? `•••• ${last4}` : "••••";
}

export function primaryIdentityReady(guest: CheckInGuestFields) {
  return filled(guest.firstName) && filled(guest.lastName) && filled(guest.phone) && filled(guest.country);
}

export function companionIdentityReady(guest: CheckInGuestFields) {
  return filled(guest.firstName) && filled(guest.lastName) && filled(guest.country);
}

export function documentReady(guest: CheckInGuestFields) {
  return knownDocumentType(guest.documentType) !== null && filled(guest.documentNumber);
}

/** Primary guest can be checked in only with name, phone, country, and a document. */
export function checkInGuestComplete(guest: CheckInGuestFields) {
  return primaryIdentityReady(guest) && documentReady(guest);
}

export function companionGuestComplete(guest: CheckInGuestFields) {
  return companionIdentityReady(guest) && documentReady(guest);
}

function cleanText(value: string | null | undefined, max: number) {
  const trimmed = value?.trim() ?? "";
  if (trimmed.length > max) throw new DomainError("Dato non valido.");
  return trimmed;
}

function parseDocument(guest: CheckInGuestFields): CheckInDocument {
  const documentType = knownDocumentType(guest.documentType);
  const documentNumber = cleanText(guest.documentNumber, 64);
  const documentCountry = cleanText(guest.documentCountry, 80) || null;
  const documentExpiresOn = guest.documentExpiresOn?.trim() || null;
  if (!documentType || !documentNumber) {
    throw new DomainError("Completa tipo e numero del documento prima del check-in.");
  }
  if (documentExpiresOn) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(documentExpiresOn)) throw new DomainError("Data di scadenza non valida.");
    const [year, month, day] = documentExpiresOn.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
      throw new DomainError("Data di scadenza non valida.");
    }
  }
  return { documentType, documentNumber, documentCountry, documentExpiresOn };
}

export function parseCheckInGuest(guest: CheckInGuestFields): CheckInGuest {
  const firstName = cleanText(guest.firstName, 80);
  const lastName = cleanText(guest.lastName, 80);
  const phone = cleanText(guest.phone, 40);
  const country = cleanText(guest.country, 80);
  const email = cleanText(guest.email, 120) || null;
  if (!firstName || !lastName || !phone || !country) {
    throw new DomainError("Completa nome, cognome, telefono e paese prima del check-in.");
  }
  return { firstName, lastName, email, phone, country, ...parseDocument(guest) };
}

export function parseCheckInCompanion(guest: CheckInGuestFields & { id?: string | null }): CheckInCompanion {
  const firstName = cleanText(guest.firstName, 80);
  const lastName = cleanText(guest.lastName, 80);
  const phone = cleanText(guest.phone, 40) || null;
  const country = cleanText(guest.country, 80);
  if (!firstName || !lastName || !country) {
    throw new DomainError("Completa nome, cognome e paese degli altri ospiti prima del check-in.");
  }
  return { id: guest.id?.trim() || undefined, firstName, lastName, phone, country, ...parseDocument(guest) };
}

export function parseCheckInParty(input: { primary: CheckInGuestFields; companions: CheckInGuestFields[]; partySize: number }) {
  const primary = parseCheckInGuest(input.primary);
  const limit = Math.max(0, input.partySize - 1);
  if (input.companions.length > limit) {
    throw new DomainError("Gli ospiti indicati superano la composizione della camera.");
  }
  return { primary, companions: input.companions.map((guest) => parseCheckInCompanion(guest)) };
}

export function stayParty(
  primary: { id: string; firstName: string; lastName: string; documentType: string | null; documentNumber: string | null },
  links: { guest: { id: string; firstName: string; lastName: string; documentType: string | null; documentNumber: string | null } }[],
): StayGuestSummary[] {
  const companions = links.filter((link) => link.guest.id !== primary.id);
  return [toSummary(primary, true), ...companions.map((link) => toSummary(link.guest, false))];
}

function toSummary(
  guest: { id: string; firstName: string; lastName: string; documentType: string | null; documentNumber: string | null },
  isPrimary: boolean,
): StayGuestSummary {
  return {
    id: guest.id,
    firstName: guest.firstName,
    lastName: guest.lastName,
    isPrimary,
    documentType: knownDocumentType(guest.documentType),
    documentLast4: documentLast4(guest.documentNumber),
  };
}
