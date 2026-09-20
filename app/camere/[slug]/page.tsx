import { notFound } from "next/navigation";

import { PageHero } from "@/components/hero/PageHero";
import { PageShell } from "@/components/layout/PageShell";
import { RoomDetail } from "@/components/rooms/RoomDetail";
import { AvailabilityBar } from "@/components/sections/AvailabilityBar";
import { JsonLd } from "@/components/seo/JsonLd";
import { hotel } from "@/lib/content";
import { getRoom, roomAmenities, roomLine, rooms } from "@/lib/rooms";
import { absUrl, breadcrumbJsonLd, pageMetadata } from "@/lib/site";
import { seasonMedia } from "@/lib/seasons";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return rooms.map((room) => ({ slug: room.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const room = getRoom(slug);
  if (!room) return { title: "Camera" };

  return pageMetadata({
    title: room.name,
    description: room.lede,
    path: `/camere/${room.slug}`,
  });
}

export default async function RoomPage({ params }: Props) {
  const { slug } = await params;
  const room = getRoom(slug);
  if (!room) notFound();

  const cover = room.image.seasonal ? seasonMedia(room.image.seasonal) : room.image;

  const roomSchema = {
    "@context": "https://schema.org",
    "@type": "HotelRoom",
    name: room.name,
    description: room.lede,
    url: absUrl(`/camere/${room.slug}`),
    image: absUrl(cover.src),
    occupancy: {
      "@type": "QuantitativeValue",
      maxValue: room.guests + (room.children ?? 0),
    },
    ...(room.beds ? { bed: room.beds } : {}),
    ...(room.size
      ? {
          floorSize: {
            "@type": "QuantitativeValue",
            value: Number.parseInt(room.size, 10),
            unitCode: "MTK",
          },
        }
      : {}),
    amenityFeature: roomAmenities.map((name) => ({
      "@type": "LocationFeatureSpecification",
      name,
      value: true,
    })),
    petsAllowed: false,
    containedInPlace: { "@id": absUrl("/#hotel") },
  };

  return (
    <PageShell>
      <JsonLd id={`room-schema-${room.slug}`} data={roomSchema} />
      <JsonLd
        id={`room-breadcrumb-${room.slug}`}
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Camere", path: "/camere" },
          { name: room.name, path: `/camere/${room.slug}` },
        ])}
      />

      <PageHero
        eyebrow={`${room.index} · ${hotel.hamlet}`}
        title={room.heroTitle}
        lede={room.lede}
        note={room.note}
        media={room.image}
        detail={roomLine(room)}
      />

      <RoomDetail room={room} />
      <AvailabilityBar layout="inline" defaultGuests={room.guests} />
    </PageShell>
  );
}
