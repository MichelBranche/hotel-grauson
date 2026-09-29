import { BookingFlow } from "@/components/booking/BookingFlow";
import { PageHero } from "@/components/hero/PageHero";
import { PageShell } from "@/components/layout/PageShell";
import { JsonLd } from "@/components/seo/JsonLd";
import { hotel } from "@/lib/content";
import { absUrl, breadcrumbJsonLd, pageMetadata } from "@/lib/site";
import { publicAvailabilityAction } from "@pms-core/actions/booking";
import type { AvailabilityOffer } from "@pms-core/types";

const description =
  "Prenota una camera alla Locanda Grauson, Gimillan di Cogne. Dopo la conferma scegliete se pagare in locanda o con carta.";

export const metadata = pageMetadata({
  title: "Prenota",
  description,
  path: "/booking",
});

export default async function BookingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkIn?: string; checkOut?: string; adults?: string; guests?: string; checkout?: string }>;
}) {
  const params = await searchParams;
  const checkIn = params.checkIn ?? "";
  const checkOut = params.checkOut ?? "";
  const adults = Number(params.adults ?? params.guests ?? 2);
  const guests = Number.isFinite(adults) && adults > 0 ? Math.min(adults, 6) : 2;

  let initialOffers: AvailabilityOffer[] = [];
  let initialNotices: string[] = [];
  let initialError: string | null = null;
  if (checkIn.length >= 10 && checkOut.length >= 10) {
    const result = await publicAvailabilityAction({ checkIn, checkOut, adults: guests });
    if (result.ok) {
      initialOffers = result.data.offers;
      initialNotices = result.data.notices;
    } else {
      initialError = result.error;
    }
  }

  return (
    <PageShell>
      <JsonLd
        id="booking-schema"
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Prenota — Locanda Grauson",
          url: absUrl("/booking"),
          about: { "@id": absUrl("/#hotel") },
          potentialAction: {
            "@type": "ReserveAction",
            target: absUrl("/booking"),
          },
        }}
      />
      <JsonLd
        id="booking-breadcrumb"
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Prenota", path: "/booking" },
        ])}
      />
      <PageHero
        eyebrow={`Soggiorno · ${hotel.hamlet}`}
        title={["Una camera", "a Gimillan"]}
        lede="Scegliete le notti, poi come pagare."
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
          initialNotices={initialNotices}
          initialError={initialError}
          checkoutCancelled={params.checkout === "cancelled"}
        />
      </section>
    </PageShell>
  );
}
