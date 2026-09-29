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
