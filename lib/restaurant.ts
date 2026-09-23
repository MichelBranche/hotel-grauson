export type DishCategory = "antipasti" | "primi" | "secondi" | "dolci";

export const dishCategories = [
  { id: "tutti", label: "Tutti" },
  { id: "antipasti", label: "Antipasti" },
  { id: "primi", label: "Primi" },
  { id: "secondi", label: "Secondi" },
  { id: "dolci", label: "Dolci" },
] as const;

export type DishFilter = (typeof dishCategories)[number]["id"];

/**
 * House preparations, not a fixed priced carta.
 * Lunch and dinner follow the day's menu, told in the dining room.
 */
export type Dish = {
  slug: string;
  name: string;
  category: DishCategory;
  description: string;
  image: { src: string; alt: string };
  price?: string;
  allergens?: string;
  seasonal?: boolean;
  active: boolean;
};

export const dishes: Dish[] = [
  {
    slug: "polenta",
    name: "Polenta",
    category: "primi",
    description: "Preparazione tradizionale di valle, con formaggio o spezzatino secondo disponibilità.",
    image: {
      src: "/images/piatto-polenta.jpg",
      alt: "Polenta con fontina e lardo, servita in un piatto di coccio",
    },
    seasonal: true,
    active: true,
  },
  {
    slug: "seupa",
    name: "Seupa",
    category: "primi",
    description: "Pane, fontina e brodo, quando è in menù.",
    image: {
      src: "/images/piatto-seupa.jpg",
      alt: "Seupa in coccio, con pane, fontina fusa e le cime fuori dalla finestra",
    },
    seasonal: true,
    active: true,
  },
  {
    slug: "carbonade",
    name: "Carbonade",
    category: "secondi",
    description: "Spezzatino di tradizione, quando è in menù.",
    image: {
      src: "/images/piatto-carbonade.jpg",
      alt: "Carbonade di manzo con polenta, servita in un piatto di coccio",
    },
    seasonal: true,
    active: true,
  },
  {
    slug: "torte",
    name: "Torte di casa",
    category: "dolci",
    description: "Di produzione propria, a colazione e quando preparate in giornata.",
    image: {
      src: "/images/piatto-torte.jpg",
      alt: "Torta di mele della casa, tagliata su un tagliere di legno",
    },
    seasonal: true,
    active: true,
  },
];

export const menuNote =
  "Non c'è una carta fissa. Queste sono le preparazioni della casa: il menù del giorno si comunica in sala.";
