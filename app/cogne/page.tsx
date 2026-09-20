import { CogneAround } from "@/components/cogne/CogneAround";
import { CogneBoard } from "@/components/cogne/CogneBoard";
import { CogneField } from "@/components/cogne/CogneField";
import { CogneHero } from "@/components/cogne/CogneHero";
import { CogneNotes } from "@/components/cogne/CogneNotes";
import { CognePlace } from "@/components/cogne/CognePlace";
import { PageShell } from "@/components/layout/PageShell";
import { JsonLd } from "@/components/seo/JsonLd";
import { hotel } from "@/lib/content";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/site";

const description =
  "Cogne e Gimillan dalla Locanda Grauson: i laghi del Grauson, Lillaz, settanta chilometri di fondo, sentieri ufficiali nel Gran Paradiso.";

export const metadata = pageMetadata({
  title: "Cogne",
  description,
  path: "/cogne",
});

const cogneSchema = {
  "@context": "https://schema.org",
  "@type": "TouristDestination",
  name: "Cogne",
  description,
  touristType: ["Escursionismo", "Sci di fondo"],
  containedInPlace: {
    "@type": "NationalPark",
    name: "Parco Nazionale Gran Paradiso",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: hotel.geo.lat,
    longitude: hotel.geo.lng,
  },
};

export default function CognePage() {
  return (
    <PageShell>
      <JsonLd id="cogne-schema" data={cogneSchema} />
      <JsonLd
        id="cogne-breadcrumb"
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Cogne", path: "/cogne" },
        ])}
      />

      <CogneHero />
      <CogneBoard />
      <CognePlace />
      <CogneAround />
      <CogneField />
      <CogneNotes />
    </PageShell>
  );
}
