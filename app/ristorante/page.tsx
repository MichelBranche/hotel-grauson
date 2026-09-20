import type { Metadata } from "next";
import Script from "next/script";

import { PageShell } from "@/components/layout/PageShell";
import { RestaurantHearth } from "@/components/restaurant/RestaurantHearth";
import { RestaurantHero } from "@/components/restaurant/RestaurantHero";
import { RestaurantMenu } from "@/components/restaurant/RestaurantMenu";
import { RestaurantPin } from "@/components/restaurant/RestaurantPin";
import { RestaurantReserve } from "@/components/restaurant/RestaurantReserve";
import { hotel } from "@/lib/content";

const description =
  "Ristorante della Locanda Grauson a Gimillan: cucina cogneintse, colazione con prodotti della valle e torte di produzione propria. Prenotazione telefonica per pranzo e cena.";

export const metadata: Metadata = {
  title: "Ristorante",
  description,
  alternates: { canonical: "/ristorante" },
  openGraph: {
    title: "Ristorante — Locanda Grauson",
    description,
    url: "/ristorante",
    images: [
      {
        url: "/images/sala-ristorante.jpg",
        alt: "Sala da pranzo in legno della Locanda Grauson, tavoli apparecchiati e le cime fuori dalle finestre",
      },
    ],
  },
};

const restaurantSchema = {
  "@context": "https://schema.org",
  "@type": "Restaurant",
  name: `${hotel.name} — Ristorante`,
  description,
  servesCuisine: "Cogneintse",
  telephone: hotel.phone,
  email: hotel.email,
  address: {
    "@type": "PostalAddress",
    streetAddress: hotel.address.street,
    addressLocality: hotel.address.city,
    postalCode: hotel.address.postalCode,
    addressCountry: hotel.address.country,
  },
  parentOrganization: {
    "@type": "Hotel",
    name: hotel.name,
  },
};

export default function RistorantePage() {
  return (
    <PageShell>
      <Script
        id="ristorante-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(restaurantSchema) }}
      />

      <RestaurantHero />
      <RestaurantPin />
      <RestaurantHearth />
      <RestaurantMenu />
      <RestaurantReserve />
    </PageShell>
  );
}
