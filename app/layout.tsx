import type { Metadata, Viewport } from "next";
import { Caveat, Geist, Instrument_Serif } from "next/font/google";
import localFont from "next/font/local";

import { EffectsProvider } from "@/components/providers/EffectsProvider";
import { SeasonProvider } from "@/components/providers/SeasonProvider";
import { SmoothScroll } from "@/components/providers/SmoothScroll";
import { hotel } from "@/lib/content";
import { seasonForDate } from "@/lib/seasons";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  display: "swap",
});

const sora = localFont({
  src: "./fonts/Sora-Variable.woff2",
  variable: "--font-sora",
  display: "swap",
  weight: "100 800",
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = "https://www.locandagrauson.it";
const description =
  "Locanda Grauson, hotel a Gimillan di Cogne (1.800 m). Gestione familiare Guichardaz-Foretier dal 1960. Camere, ristorante cogneintse, parcheggio privato. Parco Nazionale Gran Paradiso.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Locanda Grauson — Hotel a Gimillan, Cogne · Valle d'Aosta",
    template: "%s — Locanda Grauson",
  },
  description,
  keywords: [
    "Locanda Grauson",
    "hotel Cogne",
    "Gimillan",
    "Valle d'Aosta",
    "Gran Paradiso",
    "albergo di montagna",
    "dormire a Cogne",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "it_IT",
    url: siteUrl,
    siteName: "Locanda Grauson",
    title: "Locanda Grauson — Hotel a Gimillan di Cogne",
    description,
    images: [
      {
        url: "/images/hero-estate.jpg",
        width: 2560,
        height: 1691,
        alt: "La Locanda Grauson a Gimillan, con i balconi in legno fioriti di gerani",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Locanda Grauson — Hotel a Gimillan di Cogne",
    description,
    images: ["/images/hero-estate.jpg"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#f1eee6",
  colorScheme: "light",
};

const lodgingSchema = {
  "@context": "https://schema.org",
  "@type": "Hotel",
  name: hotel.name,
  description,
  url: siteUrl,
  image: `${siteUrl}/images/hero-estate.jpg`,
  telephone: hotel.phone,
  email: hotel.email,
  priceRange: "€€",
  currenciesAccepted: "EUR",
  paymentAccepted: "Cash, Credit Card",
  petsAllowed: false,
  address: {
    "@type": "PostalAddress",
    streetAddress: hotel.address.street,
    addressLocality: hotel.address.city,
    postalCode: hotel.address.postalCode,
    addressRegion: "Valle d'Aosta",
    addressCountry: hotel.address.country,
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: hotel.geo.lat,
    longitude: hotel.geo.lng,
  },
  amenityFeature: [
    { "@type": "LocationFeatureSpecification", name: "Ristorante", value: true },
    { "@type": "LocationFeatureSpecification", name: "Colazione", value: true },
    { "@type": "LocationFeatureSpecification", name: "Wi-Fi", value: true },
    { "@type": "LocationFeatureSpecification", name: "Parcheggio privato", value: true },
    { "@type": "LocationFeatureSpecification", name: "Terrazza", value: true },
    { "@type": "LocationFeatureSpecification", name: "Giardino", value: true },
  ],
  containedInPlace: {
    "@type": "Place",
    name: "Parco Nazionale del Gran Paradiso",
  },
};

/* Sets the motion flag before first paint so pre-animation states never apply
   to users without JS or with reduced-motion enabled. */
const motionFlag = `try{if(!window.matchMedia("(prefers-reduced-motion: reduce)").matches){document.documentElement.classList.add("has-motion")}}catch(e){}`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const season = seasonForDate(new Date());

  return (
    // suppressHydrationWarning: the head script adds `has-motion` to <html>
    // before React hydrates.
    <html
      lang="it"
      data-season={season}
      className={`${geist.variable} ${instrumentSerif.variable} ${caveat.variable} ${sora.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: motionFlag }} />
      </head>
      <body>
        <SeasonProvider initialSeason={season}>
          <EffectsProvider>
            <SmoothScroll>{children}</SmoothScroll>
          </EffectsProvider>
        </SeasonProvider>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(lodgingSchema) }}
        />
      </body>
    </html>
  );
}
