export type BookingQuery = {
  checkIn: string;
  checkOut: string;
  guests: number;
};

/**
 * Single seam between the UI and whichever booking engine the property adopts
 * (Booking Expert, Krossbooking, Octorate…). Set NEXT_PUBLIC_BOOKING_URL to the
 * engine's deep-link base and the form starts handing requests over to it.
 */
const providerBase = process.env.NEXT_PUBLIC_BOOKING_URL;

export const bookingProviderConfigured = Boolean(providerBase);

export function buildBookingUrl({ checkIn, checkOut, guests }: BookingQuery): string | null {
  if (providerBase) {
    const url = new URL(providerBase);
    if (checkIn) url.searchParams.set("checkin", checkIn);
    if (checkOut) url.searchParams.set("checkout", checkOut);
    url.searchParams.set("adults", String(guests));
    return url.toString();
  }

  const url = new URL("/booking", "http://local");
  if (checkIn) url.searchParams.set("checkIn", checkIn);
  if (checkOut) url.searchParams.set("checkOut", checkOut);
  url.searchParams.set("adults", String(guests));
  return `${url.pathname}${url.search}`;
}

/** ISO date (yyyy-mm-dd) for today, used as the earliest selectable day. */
export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function nextDayISO(date: string): string {
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.valueOf())) return todayISO();
  parsed.setDate(parsed.getDate() + 1);
  return parsed.toISOString().slice(0, 10);
}
