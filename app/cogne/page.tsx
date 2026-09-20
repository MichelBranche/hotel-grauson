import type { Metadata } from "next";
import Script from "next/script";

import { CogneAround } from "@/components/cogne/CogneAround";
import { CogneBoard } from "@/components/cogne/CogneBoard";
import { CogneField } from "@/components/cogne/CogneField";
import { CogneHero } from "@/components/cogne/CogneHero";
import { CogneNotes } from "@/components/cogne/CogneNotes";
import { CognePlace } from "@/components/cogne/CognePlace";
import { PageShell } from "@/components/layout/PageShell";
import { hotel } from "@/lib/content";
import { seasonMedia } from "@/lib/seasons";

const description =
  "Cogne e Gimillan dalla Locanda Grauson: i laghi del Grauson, Lillaz, settanta chilometri di fondo, sentieri ufficiali nel Gran Paradiso.";

const facciata = seasonMedia("facciata");

export const metadata: Metadata = {
  title: "Cogne",
  description,
  alternates: { canonical: "/cogne" },
  openGraph: {
    title: "Cogne — Locanda Grauson",
    description,
    url: "/cogne",
    images: [
      {
        url: facciata.src,
        alt: facciata.alt,
      },
    ],
  },
};

const cogneSchema = {
  "@context": "https://schema.org",
  "@type": "TouristDestination",
  name: "Cogne",
  description,
  touristType: "Escursionismo",
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
      <Script
        id="cogne-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(cogneSchema) }}
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
