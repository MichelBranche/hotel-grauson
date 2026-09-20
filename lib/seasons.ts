/**
 * Seasonal dressing for the site.
 *
 * Four photographs change with the calendar — the home hero, the Cogne card,
 * the Gimillan facade (Cogne hero, balcony) and the footer horizon — plus the
 * accent colour of the call-to-action buttons, which lives in `globals.css`
 * under `[data-season]`.
 *
 * The season is resolved from the date on the server (see `seasonForDate`), so
 * the switch happens on its own. The floating switcher is a demo affordance on
 * top of that: it overrides the resolved value for the current visit only.
 */

export type Season = "estate" | "autunno" | "inverno";

export type SeasonSlot = "hero" | "cogne" | "facciata" | "footer";

type SeasonDefinition = {
  /** Long form, for the switcher's accessible name. */
  label: string;
  /** Short form, for the switcher's visible label. */
  short: string;
  media: Record<SeasonSlot, { src: string; alt: string }>;
};

export const seasonOrder: Season[] = ["estate", "autunno", "inverno"];

export const seasons: Record<Season, SeasonDefinition> = {
  estate: {
    label: "Primavera e estate",
    short: "Estate",
    media: {
      hero: {
        src: "/images/hero-estate.jpg",
        alt: "La Locanda Grauson a Gimillan: facciata in legno e pietra con i balconi fioriti di gerani, il bosco di conifere e le cime del Gran Paradiso sullo sfondo",
      },
      cogne: {
        src: "/images/cogne-estate.jpg",
        alt: "Cascata e pozze d'acqua sopra Cogne, tra larici e le cime della valle",
      },
      facciata: {
        src: "/images/facciata-estate.jpg",
        alt: "La Locanda Grauson a Gimillan in estate: il campanile, i tetti del villaggio e le cime del Gran Paradiso",
      },
      footer: { src: "/images/footer-estate.webp", alt: "" },
    },
  },
  autunno: {
    label: "Autunno",
    short: "Autunno",
    media: {
      hero: {
        src: "/images/hero-autunno.jpg",
        alt: "La Locanda Grauson a Gimillan in autunno: la facciata in legno e pietra davanti ai larici dorati e alle cime del Gran Paradiso",
      },
      cogne: {
        src: "/images/cogne-autunno.jpg",
        alt: "Cascata sopra Cogne in autunno, tra i larici accesi di giallo e le cime della valle",
      },
      facciata: {
        src: "/images/facciata-autunno.jpg",
        alt: "La Locanda Grauson a Gimillan in autunno: il campanile, i larici dorati e le cime del Gran Paradiso",
      },
      footer: { src: "/images/footer-autunno.webp", alt: "" },
    },
  },
  inverno: {
    label: "Inverno",
    short: "Inverno",
    media: {
      hero: {
        src: "/images/hero-inverno.jpg",
        alt: "La Locanda Grauson a Gimillan sotto la neve: la facciata in legno e pietra, il bosco imbiancato e le cime del Gran Paradiso",
      },
      cogne: {
        src: "/images/cogne-inverno.jpg",
        alt: "La cascata sopra Cogne ghiacciata, tra le conifere innevate e le cime della valle",
      },
      facciata: {
        src: "/images/facciata-inverno.jpg",
        alt: "La Locanda Grauson a Gimillan sotto la neve: il campanile, i tetti imbiancati e le cime del Gran Paradiso",
      },
      footer: { src: "/images/footer-inverno.webp", alt: "" },
    },
  },
};

/**
 * Placeholder calendar, to be tuned with the owners: at 1.800 m the snow sits
 * well into spring, so winter runs long and there is no separate spring set.
 */
export function seasonForDate(date: Date): Season {
  const month = date.getMonth() + 1;
  if (month === 12 || month <= 3) return "inverno";
  if (month >= 10) return "autunno";
  return "estate";
}

/** Photograph for a slot on a given date — used for Open Graph and first paint. */
export function seasonMedia(slot: SeasonSlot, date = new Date()) {
  return seasons[seasonForDate(date)].media[slot];
}
