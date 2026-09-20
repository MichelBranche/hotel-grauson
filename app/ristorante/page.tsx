import { PageShell } from "@/components/layout/PageShell";
import { RestaurantHearth } from "@/components/restaurant/RestaurantHearth";
import { RestaurantHero } from "@/components/restaurant/RestaurantHero";
import { RestaurantMenu } from "@/components/restaurant/RestaurantMenu";
import { RestaurantPin } from "@/components/restaurant/RestaurantPin";
import { RestaurantReserve } from "@/components/restaurant/RestaurantReserve";
import { JsonLd } from "@/components/seo/JsonLd";
import { hotel } from "@/lib/content";
import { absUrl, breadcrumbJsonLd, pageMetadata } from "@/lib/site";

const description =
  "Ristorante della Locanda Grauson a Gimillan: cucina cogneintse, colazione con prodotti della valle e torte di produzione propria. Prenotazione telefonica per pranzo e cena.";

export const metadata = pageMetadata({
  title: "Ristorante",
  description,
  path: "/ristorante",
});

const restaurantSchema = {
  "@context": "https://schema.org",
  "@type": "Restaurant",
  "@id": absUrl("/ristorante#ristorante"),
  name: `${hotel.name} — Ristorante`,
  description,
  url: absUrl("/ristorante"),
  image: absUrl("/images/sala-ristorante.jpg"),
  servesCuisine: ["Cogneintse", "Valdostana"],
  telephone: hotel.phone,
  email: hotel.email,
  acceptsReservations: true,
  address: {
    "@type": "PostalAddress",
    streetAddress: hotel.address.street,
    addressLocality: hotel.address.city,
    postalCode: hotel.address.postalCode,
    addressCountry: hotel.address.country,
  },
  parentOrganization: { "@id": absUrl("/#hotel") },
};

export default function RistorantePage() {
  return (
    <PageShell>
      <JsonLd id="ristorante-schema" data={restaurantSchema} />
      <JsonLd
        id="ristorante-breadcrumb"
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Ristorante", path: "/ristorante" },
        ])}
      />

      <RestaurantHero />
      <RestaurantPin />
      <RestaurantHearth />
      <RestaurantMenu />
      <RestaurantReserve />
    </PageShell>
  );
}
