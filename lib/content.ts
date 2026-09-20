export const hotel = {
  name: "Locanda Grauson",
  tagline: "Cogne · Valle d'Aosta",
  family: "Guichardaz-Foretier",
  since: 1960,
  hamlet: "Gimillan",
  altitude: "1.800 m",
  address: {
    street: "Frazione Gimillan",
    postalCode: "11012",
    city: "Cogne",
    province: "AO",
    country: "IT",
  },
  phone: "+39 0165 749102",
  phoneHref: "tel:+390165749102",
  email: "info@locandagrauson.it",
  checkIn: "15:00",
  checkOut: "10:00",
  geo: { lat: 45.61722, lng: 7.35823 },
  social: {
    instagram: "https://www.instagram.com/",
    facebook: "https://www.facebook.com/",
  },
} as const;

export const houseNotes = [
  "Terrazza",
  "Giardino",
  "Parcheggio privato gratuito",
  "Wi-Fi gratuito",
] as const;

export const navLinks = [
  { label: "La locanda", href: "/#la-locanda" },
  { label: "Camere", href: "/camere" },
  { label: "Ristorante", href: "/ristorante" },
  { label: "Cogne", href: "/cogne" },
  { label: "Contatti", href: "/contatti" },
] as const;

type FeatureCardBase = {
  index: string;
  id: string;
  title: string;
  description: string;
  href: string;
};

/** A card carries its own photograph, unless it follows the season. */
export type FeatureCard =
  | (FeatureCardBase & { image: string; alt: string; seasonal?: never })
  | (FeatureCardBase & { seasonal: true; image?: never; alt?: never });

export const featureCards: FeatureCard[] = [
  {
    index: "01",
    id: "camere",
    title: "Camere",
    description: "Sette tipologie. Bagno privato, Wi-Fi, riscaldamento.",
    href: "/camere",
    image: "/images/camera-locanda.jpg",
    alt: "Camera in legno della Locanda Grauson, con copriletto a fiori e l'abbaino sul bosco",
  },
  {
    index: "02",
    id: "ristorante",
    title: "Ristorante",
    description: "Cucina cogneintse. Colazione, pranzo e cena in sala.",
    href: "/ristorante",
    image: "/images/sala-ristorante.jpg",
    alt: "Sala da pranzo in legno della Locanda Grauson, tavoli apparecchiati e le cime fuori dalle finestre",
  },
  {
    index: "03",
    id: "cogne",
    title: "Cogne",
    description: "Sentieri dal villaggio, sci di fondo, cascate di Lillaz.",
    href: "/cogne",
    seasonal: true,
  },
];

export const footerColumns = [
  {
    heading: "Locanda",
    links: [
      { label: "La locanda", href: "/#la-locanda" },
      { label: "Camere", href: "/camere" },
      { label: "Ristorante", href: "/ristorante" },
    ],
  },
  {
    heading: "Territorio",
    links: [
      { label: "Cogne", href: "/cogne" },
      { label: "Contatti", href: "/contatti" },
    ],
  },
] as const;

export const legalLinks = [
  { label: "Privacy", href: "#privacy" },
  { label: "Cookie", href: "#cookie" },
  { label: "Credits", href: "#credits" },
] as const;
