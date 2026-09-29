/** Marker stored on reservation.notes when a website guest asks to pay at the property. */
export const PAY_AT_PROPERTY_NOTE = "Richiesta web · paga in struttura";

export function chosePayAtProperty(notes: string) {
  return notes.includes(PAY_AT_PROPERTY_NOTE);
}

export function isPayAtPropertyRequest(input: { status: string; source: string; notes: string }) {
  return input.source === "website" && input.status === "OPTION" && chosePayAtProperty(input.notes);
}
