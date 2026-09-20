import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Script from "next/script";

import { PageHero } from "@/components/hero/PageHero";
import { PageShell } from "@/components/layout/PageShell";
import { RoomDetail } from "@/components/rooms/RoomDetail";
import { AvailabilityBar } from "@/components/sections/AvailabilityBar";
import { hotel } from "@/lib/content";
import { getRoom, roomLine, rooms } from "@/lib/rooms";
import { seasonMedia } from "@/lib/seasons";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return rooms.map((room) => ({ slug: room.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const room = getRoom(slug);
  if (!room) return { title: "Camera" };

  const cover = room.image.seasonal
    ? seasonMedia(room.image.seasonal)
    : room.image;

  return {
    title: room.name,
    description: room.lede,
    alternates: { canonical: `/camere/${room.slug}` },
    openGraph: {
      title: `${room.name} — Locanda Grauson`,
      description: room.lede,
      url: `/camere/${room.slug}`,
      images: [{ url: cover.src, alt: cover.alt }],
    },
  };
}

export default async function RoomPage({ params }: Props) {
  const { slug } = await params;
  const room = getRoom(slug);
  if (!room) notFound();

  const roomSchema = {
    "@context": "https://schema.org",
    "@type": "HotelRoom",
    name: room.name,
    description: room.lede,
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
    containedInPlace: {
      "@type": "Hotel",
      name: hotel.name,
      address: {
        "@type": "PostalAddress",
        streetAddress: hotel.address.street,
        addressLocality: hotel.address.city,
        postalCode: hotel.address.postalCode,
        addressCountry: hotel.address.country,
      },
    },
  };

  return (
    <PageShell>
      <Script
        id={`room-schema-${room.slug}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(roomSchema) }}
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
