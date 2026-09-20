import type { Metadata } from "next";
import Script from "next/script";

import { PageHero } from "@/components/hero/PageHero";
import { PageShell } from "@/components/layout/PageShell";
import { RoomBalconyChapter } from "@/components/rooms/RoomBalconyChapter";
import { RoomHouseChapter } from "@/components/rooms/RoomHouseChapter";
import { RoomIndexList } from "@/components/rooms/RoomIndexList";
import { AvailabilityBar } from "@/components/sections/AvailabilityBar";
import { hotel } from "@/lib/content";
import { rooms } from "@/lib/rooms";

const description =
  "Camere alla Locanda Grauson, Gimillan di Cogne: singola, economy, matrimoniale, con balcone, tripla, doppia economy, standard. Bagno privato, Wi-Fi. Non si accettano animali.";

export const metadata: Metadata = {
  title: "Camere",
  description,
  alternates: { canonical: "/camere" },
  openGraph: {
    title: "Camere — Locanda Grauson",
    description,
    url: "/camere",
    images: [
      {
        url: "/images/camera-famiglia.jpg",
        alt: "Camera della Locanda Grauson, con il letto a fiori, il tavolino e la luce del legno",
      },
    ],
  },
};

const roomsSchema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Camere della Locanda Grauson",
  itemListElement: rooms.map((room, index) => ({
    "@type": "ListItem",
    position: index + 1,
    url: `https://www.locandagrauson.it/camere/${room.slug}`,
    name: room.name,
  })),
};

export default function CamerePage() {
  return (
    <PageShell>
      <Script
        id="camere-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(roomsSchema) }}
      />

      <PageHero
        eyebrow={`Camere · ${hotel.hamlet}`}
        title={["Le camere"]}
        lede="Sette tipologie, da 9 a 42 m². Bagno privato, Wi-Fi. Animali non ammessi."
        note={"Bagno privato"}
        media={{
          src: "/images/camera-famiglia.jpg",
          alt: "Camera della Locanda Grauson, con il letto a fiori, il tavolino e la luce del legno",
        }}
      />

      <RoomIndexList />
      <RoomBalconyChapter />
      <RoomHouseChapter />
      <AvailabilityBar layout="inline" />
    </PageShell>
  );
}
