import type { Metadata } from "next";

import { BookingFlow } from "@/components/booking/BookingFlow";
import { PageHero } from "@/components/hero/PageHero";
import { PageShell } from "@/components/layout/PageShell";
import { hotel } from "@/lib/content";
import { publicAvailabilityAction } from "@pms-core/actions/booking";
import type { AvailabilityOffer } from "@pms-core/types";

const description =
  "Prenota una camera alla Locanda Grauson, Gimillan di Cogne. Date, tipologia e recapiti. Conferma della reception.";

export const metadata: Metadata = {
  title: "Prenota",
  description,
  alternates: { canonical: "/booking" },
  openGraph: {
    title: "Prenota — Locanda Grauson",
    description,
    url: "/booking",
    images: [
      {
        url: "/images/camera-locanda.jpg",
        alt: "Camera in legno della Locanda Grauson, con copriletto a fiori e l'abbaino sul bosco",
      },
    ],
  },
};

export default async function BookingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkIn?: string; checkOut?: string; adults?: string; guests?: string }>;
}) {
  const params = await searchParams;
  const checkIn = params.checkIn ?? "";
  const checkOut = params.checkOut ?? "";
  const adults = Number(params.adults ?? params.guests ?? 2);
  const guests = Number.isFinite(adults) && adults > 0 ? Math.min(adults, 6) : 2;

  let initialOffers: AvailabilityOffer[] = [];
  if (checkIn.length >= 10 && checkOut.length >= 10) {
    const result = await publicAvailabilityAction({ checkIn, checkOut, adults: guests });
    if (result.ok) initialOffers = result.data;
  }

  return (
    <PageShell>
      <PageHero
        eyebrow={`Soggiorno · ${hotel.hamlet}`}
        title={["Una camera", "a Gimillan"]}
        lede="Scegliete le notti. Vi confermiamo noi, per telefono o per lettera."
        note={"Check-in\ndalle 15"}
        media={{
          src: "/images/camera-locanda.jpg",
          alt: "Camera in legno della Locanda Grauson, con copriletto a fiori e l'abbaino sul bosco",
        }}
        detail={`${hotel.address.street} · ${hotel.address.city}`}
      />

      <section aria-labelledby="cerca-title" className="shell relative z-20 -mt-8 pb-16 sm:-mt-10 sm:pb-24">
        <BookingFlow
          checkIn={checkIn}
          checkOut={checkOut}
          adults={guests}
          initialOffers={initialOffers}
        />
      </section>
    </PageShell>
  );
}
