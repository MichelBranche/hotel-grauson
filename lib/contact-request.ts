const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;

export type ContactFields = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  checkIn?: string;
  checkOut?: string;
  message: string;
};

export type ContactDraft = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  checkIn?: string;
  checkOut?: string;
  message: string;
};

export function readContactRequest(
  input: ContactDraft,
): { ok: true; data: ContactFields } | { ok: false; error: string } {
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const email = input.email.trim();
  const phone = input.phone?.trim() || undefined;
  const checkIn = input.checkIn?.trim() || undefined;
  const checkOut = input.checkOut?.trim() || undefined;
  const message = input.message.trim();

  if (!firstName || !lastName || !email || !message) {
    return { ok: false, error: "Inserisci nome, cognome, email e un messaggio." };
  }
  if (firstName.length > 80 || lastName.length > 80) {
    return { ok: false, error: "Nome o cognome sono troppo lunghi." };
  }
  if (!EMAIL.test(email) || email.length > 160) {
    return { ok: false, error: "Inserisci un'email valida." };
  }
  if (phone && phone.length > 40) {
    return { ok: false, error: "Il telefono è troppo lungo." };
  }
  if ((checkIn && !checkOut) || (!checkIn && checkOut)) {
    return { ok: false, error: "Indicate check-in e check-out, oppure lasciate le date vuote." };
  }
  if (checkIn && checkOut) {
    if (!isDay(checkIn) || !isDay(checkOut)) {
      return { ok: false, error: "Le date non sono valide." };
    }
    if (checkOut <= checkIn) {
      return { ok: false, error: "Il check-out è dopo il check-in." };
    }
  }
  if (message.length > 2000) {
    return { ok: false, error: "Il messaggio è troppo lungo." };
  }

  return { ok: true, data: { firstName, lastName, email, phone, checkIn, checkOut, message } };
}

function isDay(value: string) {
  if (!DAY.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
