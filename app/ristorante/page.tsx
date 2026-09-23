import { PageShell } from "@/components/layout/PageShell";
import { RestaurantEditorial } from "@/components/restaurant/RestaurantEditorial";
import { RestaurantExperience } from "@/components/restaurant/RestaurantExperience";
import { RestaurantFeatures } from "@/components/restaurant/RestaurantFeatures";
import { RestaurantHero } from "@/components/restaurant/RestaurantHero";
import { RestaurantMenu } from "@/components/restaurant/RestaurantMenu";
import { JsonLd } from "@/components/seo/JsonLd";
import { hotel } from "@/lib/content";
import { dishes } from "@/lib/restaurant";
import { absUrl, breadcrumbJsonLd, pageMetadata } from "@/lib/site";

const description =
  "Il ristorante della Locanda Grauson a Gimillan di Cogne. Cucina valdostana, ingredienti locali e sapori della tradizione nel cuore della Valle d'Aosta.";

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
  hasMenu: {
    "@type": "Menu",
    name: "Preparazioni della casa",
    description: "Menù del giorno, comunicato in sala. Non è prevista una carta fissa.",
    hasMenuItem: dishes
      .filter((dish) => dish.active)
      .map((dish) => ({
        "@type": "MenuItem",
        name: dish.name,
        description: dish.description,
      })),
  },
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
      <RestaurantFeatures />
      <RestaurantEditorial />
      <RestaurantMenu />
      <RestaurantExperience />
    </PageShell>
  );
}
