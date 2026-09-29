"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { after } from "next/server";
import { z } from "zod";

import { rateLimit } from "@pms-core/auth/rate-limit";
import { wrapAction } from "@pms-core/actions/result";
import { createReservation, defaultPropertyId, getAvailabilityDetailed } from "@pms-core/integrations/booking-engine";
import { DomainError } from "@pms-core/lib/errors";
import { publicBookingByCode, requestPayAtProperty, startCheckout } from "@pms-core/services/checkout.service";

const searchSchema = z.object({
  checkIn: z.string().min(10),
  checkOut: z.string().min(10),
  adults: z.number().int().min(1).max(8),
  children: z.number().int().min(0).max(6).optional(),
});

export async function publicAvailabilityAction(input: z.infer<typeof searchSchema>) {
  return wrapAction(async () => {
    const parsed = searchSchema.parse(input);
    const result = await getAvailabilityDetailed(parsed);
    // Only stay rules (min stay, arrival days…) reach guests; setup problems stay internal.
    const notices = [...new Set(result.unavailable.filter((item) => item.guestVisible).map((item) => item.reason))];
    return { offers: result.offers, notices };
  });
}

const guestSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  phone: z.string().optional(),
  country: z.string().optional(),
});

function guestDetails(guest: z.infer<typeof guestSchema>) {
  const firstName = guest.firstName.trim();
  const lastName = guest.lastName.trim();
  const email = guest.email.trim();
  const phone = guest.phone?.trim() || undefined;
  if (!firstName || !lastName || !email) {
    throw new DomainError("Inserisci nome, cognome ed email.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new DomainError("Inserisci un'email valida.");
  }
  return { ...guest, firstName, lastName, email, phone };
}

export async function publicCreateReservationAction(input: {
  roomId: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children?: number;
  ratePlanId?: string;
  extras?: { extraId: string; quantity: number }[];
  guest: { firstName: string; lastName: string; email: string; phone?: string; country?: string };
  notes?: string;
}) {
  return wrapAction(async () => {
    const ip = (await headers()).get("x-forwarded-for") ?? "local";
    const limited = rateLimit(`booking:${ip}`, 12, 60 * 60 * 1000);
    if (!limited.ok) throw new Error("Troppe prenotazioni da questo indirizzo. Riprova più tardi.");
    const propertyId = await defaultPropertyId();
    const reservation = await createReservation({
      ...input,
      propertyId,
      status: "OPTION",
      guest: guestDetails(guestSchema.parse(input.guest)),
    });
    if (!reservation?.id || !reservation.code) {
      throw new DomainError("La prenotazione non è stata registrata. Riprovate o chiamate la locanda.");
    }
    try {
      after(() => {
        revalidatePath("/pms", "layout");
      });
    } catch (error) {
      console.error("Revalidate skipped after a public booking.", error);
    }
    return { id: reservation.id, code: reservation.code, status: reservation.status };
  });
}

export async function publicPayAtPropertyAction(code: string) {
  return wrapAction(async () => {
    const requested = await requestPayAtProperty(code);
    try {
      after(() => {
        revalidatePath("/pms", "layout");
      });
    } catch (error) {
      console.error("Revalidate skipped after pay-at-property.", error);
    }
    return requested;
  });
}

export async function publicStartCardCheckoutAction(code: string) {
  return wrapAction(async () => {
    const ip = (await headers()).get("x-forwarded-for") ?? "local";
    const limited = rateLimit(`booking-card:${ip}`, 12, 60 * 60 * 1000);
    if (!limited.ok) throw new DomainError("Troppe richieste da questo indirizzo. Riprovate più tardi.");
    const booking = await publicBookingByCode(code);
    if (!booking) throw new DomainError("Non troviamo questa prenotazione.");
    if (booking.status !== "OPTION") {
      throw new DomainError("Questa prenotazione non è in attesa di pagamento.");
    }
    try {
      const checkout = await startCheckout({
        reservationId: booking.id,
        propertyId: booking.propertyId,
        code: booking.code,
        total: booking.total,
        ratePlanId: booking.ratePlanId,
        email: booking.email,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
      });
      return { checkoutUrl: checkout.checkoutUrl };
    } catch (error) {
      console.error("Public card checkout did not open.", error);
      throw new DomainError("Pagamento online non ancora disponibile");
    }
  });
}
