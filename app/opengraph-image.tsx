import { ImageResponse } from "next/og";

export const alt = "Locanda Grauson — hotel a Gimillan di Cogne, Valle d'Aosta";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
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
          Gimillan · Cogne · Valle d&apos;Aosta
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", fontSize: 92, fontWeight: 500, letterSpacing: "-0.04em", lineHeight: 0.95 }}>
            Locanda Grauson
          </div>
          <div style={{ display: "flex", fontSize: 28, opacity: 0.72, maxWidth: 760, lineHeight: 1.35 }}>
            Hotel a 1.800 m, nel Parco Nazionale del Gran Paradiso. Gestione familiare dal 1960.
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
