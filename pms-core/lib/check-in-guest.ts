import { DomainError } from "@pms-core/lib/errors";

/** Guest fields the desk already stores and shows. Email is reviewed, not required. */
export type CheckInGuestFields = {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  country?: string | null;
};

export type CheckInGuest = {
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string;
  country: string;
};

function filled(value: string | null | undefined) {
  return Boolean(value?.trim());
}

/** Direct check-in confirm is allowed only when these are already on the guest. */
export function checkInGuestComplete(guest: CheckInGuestFields) {
  return filled(guest.firstName) && filled(guest.lastName) && filled(guest.phone) && filled(guest.country);
}

export function parseCheckInGuest(guest: CheckInGuestFields): CheckInGuest {
  const firstName = guest.firstName?.trim() ?? "";
  const lastName = guest.lastName?.trim() ?? "";
  const phone = guest.phone?.trim() ?? "";
  const country = guest.country?.trim() ?? "";
  const email = guest.email?.trim() || null;
  if (!firstName || !lastName || !phone || !country) {
    throw new DomainError("Completa nome, cognome, telefono e paese prima del check-in.");
  }
  return { firstName, lastName, email, phone, country };
}
