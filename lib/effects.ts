/**
 * Festive overlays, on top of the seasonal dressing in `lib/seasons.ts`.
 *
 * An effect is a named bundle of decorations, so the demo switcher stays a list
 * of buttons and the final version can trigger one from the calendar instead.
 */

export type Effect = "natale";

export type EffectSlot = "sala";

type EffectDefinition = {
  /** Accessible name for the switcher. */
  label: string;
  /** Visible label for the switcher. */
  short: string;
  snow: boolean;
  lights: boolean;
  media: Record<EffectSlot, { src: string; alt: string }>;
};

export const effectOrder: Effect[] = ["natale"];

export const effects: Record<Effect, EffectDefinition> = {
  natale: {
    label: "Effetti di Natale: nevicata, luci e la sala addobbata",
    short: "Natale",
    snow: true,
    lights: true,
    media: {
      sala: {
        src: "/images/sala-comune-natale.jpg",
        alt: "La sala comune della locanda a Natale: caminetto acceso, l’albero e la tavola addobbata",
      },
    },
  },
};
