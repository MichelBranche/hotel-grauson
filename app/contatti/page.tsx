import type { Metadata } from "next";
import Script from "next/script";

import { ContactArrive } from "@/components/contact/ContactArrive";
import { ContactMap } from "@/components/contact/ContactMap";
import { ContactRecapiti } from "@/components/contact/ContactRecapiti";
import { ContactWrite } from "@/components/contact/ContactWrite";
import { PageHero } from "@/components/hero/PageHero";
import { PageShell } from "@/components/layout/PageShell";
import { hotel } from "@/lib/content";
import { seasonMedia } from "@/lib/seasons";

const description =
  "Telefono, posta e carta della Locanda Grauson a Gimillan di Cogne. Come arrivare da Aosta.";

const facciata = seasonMedia("facciata");

export const metadata: Metadata = {
  title: "Contatti",
  description,
  alternates: { canonical: "/contatti" },
  openGraph: {
    title: "Contatti — Locanda Grauson",
    description,
    url: "/contatti",
    images: [
      {
        url: facciata.src,
        alt: facciata.alt,
      },
    ],
  },
};

const contactSchema = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  name: `Contatti — ${hotel.name}`,
  description,
  url: "https://www.locandagrauson.it/contatti",
  mainEntity: {
    "@type": "Hotel",
    name: hotel.name,
    telephone: hotel.phone,
    email: hotel.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: hotel.address.street,
      addressLocality: hotel.address.city,
      postalCode: hotel.address.postalCode,
      addressCountry: hotel.address.country,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: hotel.geo.lat,
      longitude: hotel.geo.lng,
    },
  },
};

export default function ContattiPage() {
  return (
    <PageShell>
      <Script
        id="contatti-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactSchema) }}
      />

      <PageHero
        eyebrow={`Contatti · ${hotel.hamlet}`}
        title={["La casa", "è a Gimillan"]}
        lede="Si chiama, si scrive, si arriva dalla strada di Cogne. Il villaggio è a 1.800 metri."
        note={"1.800 m"}
        media={{ seasonal: "facciata" }}
        detail={`${hotel.address.street} · ${hotel.address.city}`}
      />

      <ContactRecapiti />
      <ContactMap />
      <ContactArrive />
      <ContactWrite />
    </PageShell>
  );
}
