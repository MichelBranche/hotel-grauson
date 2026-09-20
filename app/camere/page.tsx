import { PageHero } from "@/components/hero/PageHero";
import { PageShell } from "@/components/layout/PageShell";
import { RoomBalconyChapter } from "@/components/rooms/RoomBalconyChapter";
import { RoomHouseChapter } from "@/components/rooms/RoomHouseChapter";
import { RoomIndexList } from "@/components/rooms/RoomIndexList";
import { AvailabilityBar } from "@/components/sections/AvailabilityBar";
import { JsonLd } from "@/components/seo/JsonLd";
import { hotel } from "@/lib/content";
import { rooms } from "@/lib/rooms";
import { absUrl, breadcrumbJsonLd, pageMetadata } from "@/lib/site";

const description =
  "Camere alla Locanda Grauson, Gimillan di Cogne: singola, economy, matrimoniale, con balcone, tripla, doppia economy, standard. Bagno privato, Wi-Fi. Non si accettano animali.";

export const metadata = pageMetadata({
  title: "Camere",
  description,
  path: "/camere",
});

const roomsSchema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Camere della Locanda Grauson",
  itemListElement: rooms.map((room, index) => ({
    "@type": "ListItem",
    position: index + 1,
    url: absUrl(`/camere/${room.slug}`),
    name: room.name,
  })),
};

export default function CamerePage() {
  return (
    <PageShell>
      <JsonLd id="camere-schema" data={roomsSchema} />
      <JsonLd
        id="camere-breadcrumb"
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Camere", path: "/camere" },
        ])}
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
