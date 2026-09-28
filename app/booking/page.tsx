import { BookingFlow } from "@/components/booking/BookingFlow";
import { validateStayDates } from "@/components/booking/dates";
import { ADULT_LIMITS, CHILD_LIMITS } from "@/components/booking/types";
import { PageHero } from "@/components/hero/PageHero";
import { PageShell } from "@/components/layout/PageShell";
import { JsonLd } from "@/components/seo/JsonLd";
import { hotel } from "@/lib/content";
import { absUrl, breadcrumbJsonLd, pageMetadata } from "@/lib/site";
import { publicAvailabilityAction } from "@pms-core/actions/booking";
import type { AvailabilityOffer } from "@pms-core/types";

const description =
  "Prenota una camera alla Locanda Grauson, Gimillan di Cogne. Date, tipologia e recapiti. Conferma della reception.";

export const metadata = pageMetadata({
  title: "Prenota",
  description,
  path: "/booking",
});

export default async function BookingPage({
  searchParams,
}: {
  searchParams: Promise<{
    checkIn?: string;
    checkOut?: string;
    adults?: string;
    guests?: string;
    children?: string;
  }>;
}) {
  const params = await searchParams;
  const checkIn = params.checkIn ?? "";
  const checkOut = params.checkOut ?? "";
  const adultsRaw = Number(params.adults ?? params.guests ?? 2);
  const guests =
    Number.isFinite(adultsRaw) && adultsRaw > 0
      ? Math.min(ADULT_LIMITS.max, Math.max(ADULT_LIMITS.min, Math.trunc(adultsRaw)))
      : 2;
  const childrenRaw = Number(params.children ?? 0);
  const children = Number.isFinite(childrenRaw)
    ? Math.min(CHILD_LIMITS.max, Math.max(CHILD_LIMITS.min, Math.trunc(childrenRaw)))
    : 0;

  // La pagina resta un Server Component: se l'indirizzo ha già date valide,
  // chiede le camere al PMS prima che il browser disegni il modulo.
  // I controlli sulle date sono gli stessi del campo check-in.
  const dates = { checkIn, checkOut };
  const datesValid = validateStayDates(dates) === null;
  let initialOffers: AvailabilityOffer[] = [];
  let initialError: string | null = null;
  if (datesValid) {
    const result = await publicAvailabilityAction({ checkIn, checkOut, adults: guests, children });
    if (result.ok) initialOffers = result.data;
    else initialError = result.error;
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
        lede="Scegliete le notti. Vi confermiamo noi, per telefono o per lettera."
        note={"Check-in\ndalle 15"}
        media={{
          src: "/images/camera-locanda.jpg",
          alt: "Camera in legno della Locanda Grauson, con copriletto a fiori e l'abbaino sul bosco",
        }}
        detail={`${hotel.address.street} · ${hotel.address.city}`}
      />

      <section aria-labelledby="cerca-title" className="shell relative z-20 -mt-8 pb-20 sm:-mt-12 sm:pb-28">
        <BookingFlow
          checkIn={checkIn}
          checkOut={checkOut}
          adults={guests}
          childCount={children}
          initialOffers={initialOffers}
          initialSearched={datesValid}
          initialError={initialError}
          initialDateAttempted={!datesValid && (checkIn.length > 0 || checkOut.length > 0)}
        />
      </section>
    </PageShell>
  );
}
