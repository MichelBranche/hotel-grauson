import { toISODate } from "@pms-core/lib/dates";
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

export const SEX_OPTIONS = [
  { value: "M", label: "Maschio" },
  { value: "F", label: "Femmina" },
  { value: "X", label: "Altro" },
] as const;

export type GuestSex = (typeof SEX_OPTIONS)[number]["value"];

export const GUEST_ROLES = [
  { value: "LEADER", label: "Capogruppo" },
  { value: "GUEST", label: "Ospite" },
] as const;

const EXPIRY_REQUIRED = new Set<DocumentType>(["CI", "PASSPORT", "LICENSE"]);

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
  sex?: string | null;
  dateOfBirth?: string | Date | null;
  birthPlace?: string | null;
  citizenship?: string | null;
  email?: string | null;
  phone?: string | null;
  residenceAddress?: string | null;
  residencePostalCode?: string | null;
  residenceCity?: string | null;
  residenceProvince?: string | null;
  residenceCountry?: string | null;
  documentType?: string | null;
  documentNumber?: string | null;
  documentAuthority?: string | null;
  documentIssuedOn?: string | Date | null;
  documentCountry?: string | null;
  documentExpiresOn?: string | Date | null;
};

export type CheckInPerson = {
  id?: string;
  firstName: string;
  lastName: string;
  sex: GuestSex;
  dateOfBirth: string;
  birthPlace: string;
  citizenship: string;
  email: string | null;
  phone: string | null;
  residenceAddress: string;
  residencePostalCode: string | null;
  residenceCity: string;
  residenceProvince: string | null;
  residenceCountry: string;
  documentType: DocumentType;
  documentNumber: string;
  documentAuthority: string;
  documentIssuedOn: string;
  documentCountry: string;
  documentExpiresOn: string | null;
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

export function sexLabel(value: string | null | undefined) {
  return SEX_OPTIONS.find((item) => item.value === value)?.label ?? "Non indicato";
}

export function roleLabel(role: string | null | undefined, isPrimary = false) {
  if (isPrimary || role === "LEADER") return "Capogruppo";
  return "Ospite";
}

/** IT, ITA and Italia count as Italy. CAP and province are then required. */
export function isItalyResidence(country: string | null | undefined) {
  const value = country?.trim().toLowerCase() ?? "";
  return value === "it" || value === "ita" || value === "italia";
}

export function expiryRequired(type: string | null | undefined) {
  const known = knownDocumentType(type);
  return known !== null && EXPIRY_REQUIRED.has(known);
}

function calendarDate(value: string | Date | null | undefined) {
  if (!value) return null;
  const iso = value instanceof Date ? toISODate(value) : value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return iso;
}

function knownSex(value: string | null | undefined): GuestSex | null {
  const found = SEX_OPTIONS.find((item) => item.value === value);
  return found ? found.value : null;
}

/** Same required set for the group leader and for every other guest. Phone and email never block. */
export function checkInGuestComplete(guest: CheckInGuestFields) {
  if (!filled(guest.firstName) || !filled(guest.lastName) || !knownSex(guest.sex)) return false;
  const birth = calendarDate(guest.dateOfBirth);
  if (!birth || birth > new Date().toISOString().slice(0, 10)) return false;
  if (!filled(guest.birthPlace) || !filled(guest.citizenship)) return false;
  if (!filled(guest.residenceAddress) || !filled(guest.residenceCity) || !filled(guest.residenceCountry)) return false;
  if (isItalyResidence(guest.residenceCountry) && (!filled(guest.residencePostalCode) || !filled(guest.residenceProvince))) return false;
  const documentType = knownDocumentType(guest.documentType);
  if (!documentType || !filled(guest.documentNumber) || !filled(guest.documentAuthority) || !filled(guest.documentCountry)) return false;
  if (!calendarDate(guest.documentIssuedOn)) return false;
  if (expiryRequired(documentType) && !calendarDate(guest.documentExpiresOn)) return false;
  if (guest.documentExpiresOn && !calendarDate(guest.documentExpiresOn)) return false;
  return true;
}

export function companionGuestComplete(guest: CheckInGuestFields) {
  return checkInGuestComplete(guest);
}

export function checkInCompanionBlank(guest: CheckInGuestFields) {
  if (guest.id) return false;
  const values = [
    guest.firstName,
    guest.lastName,
    guest.sex,
    typeof guest.dateOfBirth === "string" ? guest.dateOfBirth : "",
    guest.birthPlace,
    guest.citizenship,
    guest.email,
    guest.phone,
    guest.residenceAddress,
    guest.residencePostalCode,
    guest.residenceCity,
    guest.residenceProvince,
    guest.residenceCountry,
    guest.documentType,
    guest.documentNumber,
    guest.documentAuthority,
    typeof guest.documentIssuedOn === "string" ? guest.documentIssuedOn : "",
    guest.documentCountry,
    typeof guest.documentExpiresOn === "string" ? guest.documentExpiresOn : "",
  ];
  return values.every((value) => !filled(value));
}

function cleanText(value: string | null | undefined, max: number) {
  const trimmed = value?.trim() ?? "";
  if (trimmed.length > max) throw new DomainError("Dato non valido.");
  return trimmed;
}

function requireDate(value: string | Date | null | undefined, message: string) {
  const iso = calendarDate(typeof value === "string" ? value : value ?? null);
  if (!iso) throw new DomainError(message);
  return iso;
}

function parseCheckInPerson(guest: CheckInGuestFields, id?: string): CheckInPerson {
  const firstName = cleanText(guest.firstName, 80);
  const lastName = cleanText(guest.lastName, 80);
  const sex = knownSex(guest.sex);
  const birthPlace = cleanText(guest.birthPlace, 120);
  const citizenship = cleanText(guest.citizenship, 80);
  const email = cleanText(guest.email, 120) || null;
  const phone = cleanText(guest.phone, 40) || null;
  const residenceAddress = cleanText(guest.residenceAddress, 160);
  const residenceCity = cleanText(guest.residenceCity, 80);
  const residenceCountry = cleanText(guest.residenceCountry, 80);
  const residencePostalCode = cleanText(guest.residencePostalCode, 12) || null;
  const residenceProvince = cleanText(guest.residenceProvince, 40) || null;
  const documentType = knownDocumentType(guest.documentType);
  const documentNumber = cleanText(guest.documentNumber, 64);
  const documentAuthority = cleanText(guest.documentAuthority, 120);
  const documentCountry = cleanText(guest.documentCountry, 80);
  if (!firstName || !lastName || !sex || !birthPlace || !citizenship) {
    throw new DomainError("Completa anagrafica dell'ospite prima del check-in.");
  }
  const dateOfBirth = requireDate(guest.dateOfBirth, "Data di nascita non valida.");
  if (dateOfBirth > new Date().toISOString().slice(0, 10)) throw new DomainError("Data di nascita non valida.");
  if (!residenceAddress || !residenceCity || !residenceCountry) {
    throw new DomainError("Completa la residenza dell'ospite prima del check-in.");
  }
  if (isItalyResidence(residenceCountry) && (!residencePostalCode || !residenceProvince)) {
    throw new DomainError("Per la residenza in Italia servono CAP e provincia.");
  }
  if (!documentType || !documentNumber || !documentAuthority || !documentCountry) {
    throw new DomainError("Completa il documento dell'ospite prima del check-in.");
  }
  const documentIssuedOn = requireDate(guest.documentIssuedOn, "Data di emissione non valida.");
  const expiryRaw = typeof guest.documentExpiresOn === "string" ? guest.documentExpiresOn.trim() : guest.documentExpiresOn;
  const documentExpiresOn = expiryRaw ? requireDate(expiryRaw, "Data di scadenza non valida.") : null;
  if (expiryRequired(documentType) && !documentExpiresOn) {
    throw new DomainError("Indica la scadenza del documento.");
  }
  if (documentExpiresOn && documentIssuedOn > documentExpiresOn) {
    throw new DomainError("Date del documento non coerenti.");
  }
  return {
    id,
    firstName,
    lastName,
    sex,
    dateOfBirth,
    birthPlace,
    citizenship,
    email,
    phone,
    residenceAddress,
    residencePostalCode,
    residenceCity,
    residenceProvince,
    residenceCountry,
    documentType,
    documentNumber,
    documentAuthority,
    documentIssuedOn,
    documentCountry,
    documentExpiresOn,
  };
}

export function parseCheckInGuest(guest: CheckInGuestFields): CheckInPerson {
  return parseCheckInPerson(guest);
}

export function parseCheckInCompanion(guest: CheckInGuestFields): CheckInPerson {
  return parseCheckInPerson(guest, guest.id?.trim() || undefined);
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
