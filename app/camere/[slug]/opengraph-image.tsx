import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";

import { getRoom, rooms } from "@/lib/rooms";

export const alt = "Camera della Locanda Grauson a Gimillan di Cogne";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return rooms.map((room) => ({ slug: room.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const room = getRoom(slug);
  if (!room) notFound();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#263229",
          color: "#f7f5ef",
          padding: 72,
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 22,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            opacity: 0.62,
          }}
        >
          Camere · Locanda Grauson
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              display: "flex",
              fontSize: 78,
              fontWeight: 500,
              letterSpacing: "-0.04em",
              lineHeight: 0.95,
            }}
          >
            {room.name}
          </div>
          <div style={{ display: "flex", fontSize: 28, opacity: 0.72 }}>
            {room.promise} · Gimillan di Cogne
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
