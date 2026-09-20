import type { EffectSlot } from "@/lib/effects";
import type { SeasonSlot } from "@/lib/seasons";

export type RoomMedia =
  | { src: string; alt: string; seasonal?: never }
  | { seasonal: SeasonSlot; src?: never; alt?: never };

export type Room = {
  slug: string;
  index: string;
  name: string;
  /** One-line promise, used on the listing. */
  promise: string;
  heroTitle: readonly [string, string] | readonly [string];
  headline: string;
  lede: string;
  story: string;
  note: string;
  guests: number;
  children?: number;
  guestLabel: string;
  size?: string;
  beds?: string;
  extras: string[];
  image: RoomMedia;
  /** Second photograph on the detail page: the house around the room. */
  house: { src: string; alt: string; effect?: EffectSlot };
};

const house = {
  src: "/images/sala-comune.jpg",
  alt: "La sala comune della locanda: caminetto acceso, il tavolo da pranzo e la luce della sera",
  effect: "sala" as EffectSlot,
};

const woodRoom = {
  src: "/images/camera-famiglia.jpg",
  alt: "Camera in legno della Locanda Grauson, con il letto a fiori, il tavolino e la luce del legno",
};

const singleRoom = {
  src: "/images/camera-locanda.jpg",
  alt: "Camera in legno della Locanda Grauson, con copriletto a fiori e l'abbaino sul bosco",
};

export const roomAmenities = [
  "Bagno privato con doccia, bidet e asciugacapelli",
  "Set di cortesia",
  "Riscaldamento",
  "Armadio",
  "Wi-Fi gratuito",
] as const;

export const roomRules = [
  {
    title: "Accesso",
    body: "In camera è consentito soltanto l’ingresso agli ospiti registrati.",
  },
  {
    title: "Pagamento",
    body: "Al check-in: carta di credito intestata al prenotante, oppure contanti.",
  },
  {
    title: "Animali",
    body: "Animali non ammessi.",
  },
] as const;

export const rooms: Room[] = [
  {
    slug: "singola",
    index: "01",
    name: "Camera singola standard",
    promise: "9 m² · 1 ospite",
    heroTitle: ["Camera singola", "standard"],
    headline: "Camera singola standard",
    lede: "9 m², 1 ospite, letto singolo. Bagno privato, Wi-Fi, riscaldamento.",
    story:
      "Camera singola di 9 m² per 1 ospite. Letto singolo, bagno privato con doccia, Wi-Fi e riscaldamento.",
    note: "9 m² · 1 ospite",
    guests: 1,
    guestLabel: "1 ospite",
    size: "9 m²",
    beds: "Letto singolo",
    extras: [],
    image: singleRoom,
    house,
  },
  {
    slug: "economy",
    index: "02",
    name: "Camera economy",
    promise: "12 m² · 2 ospiti",
    heroTitle: ["Camera", "economy"],
    headline: "Camera economy",
    lede: "12 m², 2 ospiti. Bagno privato, Wi-Fi, riscaldamento.",
    story:
      "Camera economy di 12 m² per 2 ospiti. Bagno privato con doccia, Wi-Fi e riscaldamento.",
    note: "12 m² · 2 ospiti",
    guests: 2,
    guestLabel: "2 ospiti",
    size: "12 m²",
    extras: [],
    image: woodRoom,
    house,
  },
  {
    slug: "matrimoniale",
    index: "03",
    name: "Camera matrimoniale",
    promise: "20 m² · 2 ospiti",
    heroTitle: ["Camera", "matrimoniale"],
    headline: "Camera matrimoniale",
    lede: "20 m², 2 ospiti, letto matrimoniale. Bagno privato, Wi-Fi, riscaldamento.",
    story:
      "Camera matrimoniale di 20 m² per 2 ospiti. Letto matrimoniale, bagno privato con doccia, Wi-Fi e riscaldamento.",
    note: "20 m² · 2 ospiti",
    guests: 2,
    guestLabel: "2 ospiti",
    size: "20 m²",
    beds: "Letto matrimoniale",
    extras: [],
    image: woodRoom,
    house,
  },
  {
    slug: "balcone",
    index: "04",
    name: "Camera matrimoniale con balcone",
    promise: "12 m² · 2 ospiti · balcone",
    heroTitle: ["Matrimoniale", "con balcone"],
    headline: "Camera matrimoniale con balcone",
    lede: "12 m², 2 ospiti, letto matrimoniale e balcone. Bagno privato, Wi-Fi, riscaldamento.",
    story:
      "Camera matrimoniale di 12 m² per 2 ospiti, con balcone sulla facciata. Letto matrimoniale, bagno privato con doccia, Wi-Fi e riscaldamento.",
    note: "12 m² · balcone",
    guests: 2,
    guestLabel: "2 ospiti",
    size: "12 m²",
    beds: "Letto matrimoniale",
    extras: ["Balcone"],
    image: { seasonal: "facciata" },
    house: {
      src: "/images/camera-famiglia.jpg",
      alt: "L'interno della camera: il letto a fiori, il tavolino e il legno della casa",
    },
  },
  {
    slug: "tripla",
    index: "05",
    name: "Camera tripla",
    promise: "16 m² · 3 adulti · 1 bambino",
    heroTitle: ["Camera", "tripla"],
    headline: "Camera tripla",
    lede: "16 m². Occupazione: 3 adulti e 1 bambino. Bagno privato, Wi-Fi, riscaldamento.",
    story:
      "Camera tripla di 16 m². Occupazione massima: 3 adulti e 1 bambino. Bagno privato con doccia, Wi-Fi e riscaldamento.",
    note: "16 m² · 3+1",
    guests: 3,
    children: 1,
    guestLabel: "3 adulti · 1 bambino",
    size: "16 m²",
    extras: [],
    image: woodRoom,
    house,
  },
  {
    slug: "doppia-economy",
    index: "06",
    name: "Camera doppia economy",
    promise: "42 m² · 3 ospiti",
    heroTitle: ["Doppia", "economy"],
    headline: "Camera doppia economy",
    lede: "42 m², fino a 3 ospiti. Bagno privato, Wi-Fi, riscaldamento.",
    story:
      "Camera doppia economy di 42 m² per un massimo di 3 ospiti. Bagno privato con doccia, Wi-Fi e riscaldamento.",
    note: "42 m² · 3 ospiti",
    guests: 3,
    guestLabel: "3 ospiti",
    size: "42 m²",
    extras: [],
    image: woodRoom,
    house,
  },
  {
    slug: "standard",
    index: "07",
    name: "Camera standard",
    promise: "20 m² · 4 ospiti",
    heroTitle: ["Camera", "standard"],
    headline: "Camera standard",
    lede: "20 m², fino a 4 ospiti. Bagno privato, Wi-Fi, riscaldamento.",
    story:
      "Camera standard di 20 m² per un massimo di 4 ospiti. Bagno privato con doccia, Wi-Fi e riscaldamento.",
    note: "20 m² · 4 ospiti",
    guests: 4,
    guestLabel: "4 ospiti",
    size: "20 m²",
    extras: [],
    image: woodRoom,
    house,
  },
];

export function getRoom(slug: string): Room | undefined {
  return rooms.find((room) => room.slug === slug);
}

export function otherRooms(slug: string): Room[] {
  return rooms.filter((room) => room.slug !== slug);
}

export function roomHref(slug: string): string {
  return `/camere/${slug}`;
}

export function roomLine(room: Pick<Room, "size" | "guestLabel" | "beds">) {
  return [room.size, room.guestLabel, room.beds].filter(Boolean).join("  ·  ");
}
