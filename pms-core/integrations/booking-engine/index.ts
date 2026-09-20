import { availabilityService } from "@pms-core/services/availability.service";
import { reservationService, type ReservationDraft } from "@pms-core/services/reservation.service";
import { prisma } from "@pms-core/database/client";
import { propertyConfig } from "@pms-core/config/property";

/**
 * Public boundary used by the hotel website.
 * Keep these function signatures stable — they can later be exposed as HTTP APIs.
 */
export async function getAvailability(input: {
  checkIn: string;
  checkOut: string;
  adults: number;
  children?: number;
  roomTypeId?: string;
  propertyId?: string;
}) {
  const propertyId = input.propertyId ?? (await defaultPropertyId());
  return availabilityService.search({ ...input, propertyId });
}

export async function createReservation(draft: Omit<ReservationDraft, "source" | "channel"> & { source?: string }) {
  return reservationService.create(
    {
      ...draft,
      source: draft.source ?? "website",
      channel: "DIRECT",
      status: "CONFIRMED",
    },
    { name: "booking-engine" },
  );
}

export async function getReservation(idOrCode: string) {
  return (
    (await reservationService.get(idOrCode)) ??
    (await prisma.reservation.findUnique({
      where: { code: idOrCode },
      include: {
        guest: true,
        room: { include: { roomType: true } },
        roomType: true,
        payments: true,
        extras: { include: { extra: true } },
        guests: { include: { guest: true } },
      },
    }))
  );
}

export async function defaultPropertyId() {
  const property = await prisma.property.findUnique({ where: { slug: propertyConfig.propertySlug } });
  if (!property) throw new Error("Property not seeded. Run npm run db:seed.");
  return property.id;
}

export { availabilityService, reservationService };
