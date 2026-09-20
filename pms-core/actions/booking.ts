"use server";

import { headers } from "next/headers";
import { z } from "zod";

import { rateLimit } from "@pms-core/auth/rate-limit";
import { wrapAction } from "@pms-core/actions/result";
import { createReservation, defaultPropertyId, getAvailability } from "@pms-core/integrations/booking-engine";

const searchSchema = z.object({
  checkIn: z.string().min(10),
  checkOut: z.string().min(10),
  adults: z.number().int().min(1).max(8),
  children: z.number().int().min(0).max(6).optional(),
});

export async function publicAvailabilityAction(input: z.infer<typeof searchSchema>) {
  return wrapAction(async () => {
    const parsed = searchSchema.parse(input);
    return getAvailability(parsed);
  });
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
    const reservation = await createReservation({ ...input, propertyId });
    return { id: reservation?.id, code: reservation?.code };
  });
}
