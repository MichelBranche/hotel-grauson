/**
 * Seasonal dressing for the public site. Europe/Rome local date.
 *
 * Photographic sets exist for estate, autunno and inverno only. Primavera is a
 * real calendar season and falls back to the estate photographs.
 * TODO: missing primavera assets — hero, cogne, facciata, footer.
 * Fallback order when a set is missing: estate → autunno → inverno.
 *
 * Ranges (no other month logic should exist):
 * - inverno: 1 Dec – 31 Mar
 * - primavera: 1 Apr – 31 May
 * - estate: 1 Jun – 15 Sep
 * - autunno: 16 Sep – 30 Nov
 *
 * QA only, never a visible control:
 * - `?season=inverno|primavera|estate|autunno` on a page URL
 * - `NEXT_PUBLIC_FORCE_SEASON` with the same keys (leave unset in production)
 * The query wins over the env var. Both are applied in `resolveSeason` / the
 * season provider; components only read the resolved season.
 */

export type Season = "inverno" | "primavera" | "estate" | "autunno";

/** Seasons that have photographs in /public/images. */
export type SeasonPhotos = "estate" | "autunno" | "inverno";

export type SeasonSlot = "hero" | "cogne" | "facciata" | "footer";

type SeasonDefinition = {
  media: Record<SeasonSlot, { src: string; alt: string }>;
};

const ROME = "Europe/Rome";

export const seasons: Record<SeasonPhotos, SeasonDefinition> = {
  estate: {
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

const photoFallback: Record<Season, SeasonPhotos> = {
  inverno: "inverno",
  // TODO: missing primavera assets (hero, cogne, facciata, footer). Estate exists, so the chain stops there.
  primavera: "estate",
  estate: "estate",
  autunno: "autunno",
};

/** Photograph set for a calendar season. Primavera uses the estate set. */
export function photoSeason(season: Season): SeasonPhotos {
  return photoFallback[season];
}

function romeMonthDay(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: ROME,
    month: "numeric",
    day: "numeric",
  }).formatToParts(date);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);
  return { month, day };
}

/** Active season for a calendar instant. Defaults to now, in Europe/Rome. */
export function getActiveSeason(date = new Date()): Season {
  const { month, day } = romeMonthDay(date);
  if (month === 12 || month <= 3) return "inverno";
  if (month <= 5) return "primavera";
  if (month <= 8) return "estate";
  if (month === 9 && day <= 15) return "estate";
  return "autunno";
}

const seasonKeys: readonly Season[] = ["inverno", "primavera", "estate", "autunno"];

/** Accepts a QA override key. Anything else is ignored. */
export function parseSeasonOverride(value: string | null | undefined): Season | null {
  if (!value) return null;
  const key = value.trim().toLowerCase();
  return seasonKeys.find((season) => season === key) ?? null;
}

/**
 * Season for server render: env force, otherwise the Rome calendar.
 * `?season=` is applied in the client provider so a static page can still be overridden.
 */
export function resolveSeason(date = new Date()): Season {
  return parseSeasonOverride(process.env.NEXT_PUBLIC_FORCE_SEASON) ?? getActiveSeason(date);
}

/** Photograph for a slot on a given date — Open Graph, JSON-LD, and first paint. */
export function seasonMedia(slot: SeasonSlot, date = new Date()) {
  return seasons[photoSeason(resolveSeason(date))].media[slot];
}
