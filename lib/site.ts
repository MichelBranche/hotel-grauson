import type { Metadata } from "next";

import { contactGooglePlace } from "@/lib/contact";
import { hotel } from "@/lib/content";
import { rooms } from "@/lib/rooms";

export const siteUrl = "https://www.locandagrauson.it";
export const siteName = hotel.name;

export const siteDescription =
  "Locanda Grauson, hotel a Gimillan di Cogne (1.800 m). Gestione familiare Guichardaz-Foretier dal 1960. Camere, ristorante cogneintse, parcheggio privato. Parco Nazionale Gran Paradiso.";

export function absUrl(path = "/") {
  return new URL(path, siteUrl).toString();
}

export function pageMetadata({
  title,
  description,
  path,
  index = true,
}: {
  title: string;
  description: string;
  path: string;
  index?: boolean;
}): Metadata {
  const url = absUrl(path);
  const fullTitle = path === "/" ? title : `${title} — ${siteName}`;

  return {
    title: path === "/" ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    robots: index
      ? {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        }
      : { index: false, follow: false },
    openGraph: {
      type: "website",
      locale: "it_IT",
      url,
      siteName,
      title: fullTitle,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absUrl(item.path),
    })),
  };
}

export function hotelJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": ["Hotel", "LodgingBusiness"],
    "@id": absUrl("/#hotel"),
    name: hotel.name,
    alternateName: "Hotel Grauson",
    description: siteDescription,
    url: siteUrl,
    inLanguage: "it-IT",
    image: [
      absUrl("/images/hero-estate.jpg"),
      absUrl("/images/camera-locanda.jpg"),
      absUrl("/images/sala-ristorante.jpg"),
    ],
    logo: absUrl("/images/logo-grauson.png"),
    telephone: hotel.phone,
    email: hotel.email,
    priceRange: "€€",
    currenciesAccepted: "EUR",
    paymentAccepted: "Cash, Credit Card",
    petsAllowed: false,
    checkinTime: hotel.checkIn,
    checkoutTime: hotel.checkOut,
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
    hasMap: contactGooglePlace,
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
    makesOffer: rooms.map((room) => ({
      "@type": "Offer",
      name: room.name,
      url: absUrl(`/camere/${room.slug}`),
    })),
    potentialAction: {
      "@type": "ReserveAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: absUrl("/booking"),
        actionPlatform: ["http://schema.org/DesktopWebPlatform", "http://schema.org/MobileWebPlatform"],
      },
      result: {
        "@type": "LodgingReservation",
        name: "Richiesta di soggiorno",
      },
    },
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": absUrl("/#website"),
    name: siteName,
    url: siteUrl,
    inLanguage: "it-IT",
    description: siteDescription,
    publisher: { "@id": absUrl("/#hotel") },
  };
}

export const publicRoutes = [
  { path: "/", changeFrequency: "weekly" as const, priority: 1 },
  { path: "/camere", changeFrequency: "weekly" as const, priority: 0.9 },
  ...rooms.map((room) => ({
    path: `/camere/${room.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  })),
  { path: "/ristorante", changeFrequency: "monthly" as const, priority: 0.8 },
  { path: "/cogne", changeFrequency: "monthly" as const, priority: 0.7 },
  { path: "/contatti", changeFrequency: "yearly" as const, priority: 0.7 },
  { path: "/booking", changeFrequency: "weekly" as const, priority: 0.85 },
  { path: "/privacy", changeFrequency: "yearly" as const, priority: 0.2 },
];
