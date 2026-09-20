import type { Metadata, Viewport } from "next";
import { Caveat, Geist, Instrument_Serif } from "next/font/google";
import localFont from "next/font/local";

import { Analytics } from "@vercel/analytics/next";

import { JsonLd } from "@/components/seo/JsonLd";
import { EffectsProvider } from "@/components/providers/EffectsProvider";
import { SeasonProvider } from "@/components/providers/SeasonProvider";
import { SmoothScroll } from "@/components/providers/SmoothScroll";
import { hotelJsonLd, siteDescription, siteName, siteUrl, websiteJsonLd } from "@/lib/site";
import { seasonForDate } from "@/lib/seasons";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const sora = localFont({
  src: "./fonts/Sora-Variable.woff2",
  variable: "--font-sora",
  display: "swap",
  weight: "100 800",
  preload: true,
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
  preload: false,
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

export const revalidate = 3600;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteName} — Hotel a Gimillan, Cogne · Valle d'Aosta`,
    template: `%s — ${siteName}`,
  },
  description: siteDescription,
  applicationName: siteName,
  authors: [{ name: siteName, url: siteUrl }],
  creator: siteName,
  publisher: siteName,
  category: "travel",
  keywords: [
    "Locanda Grauson",
    "hotel Cogne",
    "Gimillan",
    "Valle d'Aosta",
    "Gran Paradiso",
    "albergo di montagna",
    "dormire a Cogne",
  ],
  openGraph: {
    type: "website",
    locale: "it_IT",
    url: siteUrl,
    siteName,
    title: `${siteName} — Hotel a Gimillan di Cogne`,
    description: siteDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteName} — Hotel a Gimillan di Cogne`,
    description: siteDescription,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f1eee6",
  colorScheme: "light",
};

/* Sets the motion flag before first paint so pre-animation states never apply
   to users without JS, with reduced-motion, or on a constrained connection. */
const motionFlag = `try{var r=window.matchMedia("(prefers-reduced-motion: reduce)").matches;var c=navigator.connection;var s=c&&(c.saveData||c.effectiveType==="slow-2g"||c.effectiveType==="2g");if(!r&&!s)document.documentElement.classList.add("has-motion")}catch(e){}`;

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
        <style
          dangerouslySetInnerHTML={{
            __html:
              ".has-motion [data-hero-line]{overflow:hidden}.has-motion [data-hero-line]>span{display:block;opacity:0}",
          }}
        />
      </head>
      <body>
        <SeasonProvider initialSeason={season}>
          <EffectsProvider>
            <SmoothScroll>{children}</SmoothScroll>
          </EffectsProvider>
        </SeasonProvider>
        <JsonLd id="hotel-schema" data={hotelJsonLd()} />
        <JsonLd id="website-schema" data={websiteJsonLd()} />
        <Analytics />
      </body>
    </html>
  );
}
