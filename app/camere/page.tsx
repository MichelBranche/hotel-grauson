import { PageHero } from "@/components/hero/PageHero";
import { PageShell } from "@/components/layout/PageShell";
import { RoomCatalog } from "@/components/rooms/RoomCatalog";
import { RoomsClose } from "@/components/rooms/RoomsClose";
import { JsonLd } from "@/components/seo/JsonLd";
import { rooms } from "@/lib/rooms";
import { absUrl, breadcrumbJsonLd, pageMetadata } from "@/lib/site";

const description =
  "Camere della Locanda Grauson a Gimillan di Cogne, nel cuore della Valle d'Aosta. Ospitalità autentica, comfort alpino e vista sulle montagne.";

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
        eyebrow="Camere"
        title={["Camere"]}
        lede="Sette ambienti, un'unica atmosfera. Natura, comfort e autenticità."
        note={"Svegliarsi\ncon la montagna."}
        media={{
          src: "/images/camera-famiglia.jpg",
          alt: "Camera in legno della Locanda Grauson, con il letto a fiori, il tavolino e la luce del legno",
        }}
      />

      <RoomCatalog />
      <RoomsClose />
    </PageShell>
  );
}
