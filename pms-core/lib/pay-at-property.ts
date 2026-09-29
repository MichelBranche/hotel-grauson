/** Marker stored on reservation.notes when a website guest asks to pay at the property. */
export const PAY_AT_PROPERTY_NOTE = "Richiesta web · paga in struttura";

export function chosePayAtProperty(notes: string) {
  return notes.includes(PAY_AT_PROPERTY_NOTE);
}

export function isPayAtPropertyRequest(input: { status: string; source: string; notes: string }) {
  return input.source === "website" && input.status === "OPTION" && chosePayAtProperty(input.notes);
}

export const PAY_AT_PROPERTY_NOTIFICATION = "reservation.pay_at_property";

/** One in-app notice for reception. The same reservation does not get a second copy. */
export function payAtPropertyNotification(input: { code: string; guestName?: string | null }) {
  const guest = input.guestName?.trim();
  return {
    type: PAY_AT_PROPERTY_NOTIFICATION,
    title: "Nuova richiesta web",
    body: guest ? `${input.code} · ${guest}` : input.code,
  };
}
