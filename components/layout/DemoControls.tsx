"use client";

import { Leaf, Snowflake, Sparkles, Sun } from "lucide-react";

import { useEffects } from "@/components/providers/EffectsProvider";
import { useSeason } from "@/components/providers/SeasonProvider";
import { type Effect, effectOrder, effects } from "@/lib/effects";
import { type Season, seasonOrder, seasons } from "@/lib/seasons";

const seasonIcons: Record<Season, typeof Sun> = {
  estate: Sun,
  autunno: Leaf,
  inverno: Snowflake,
};

const effectIcons: Record<Effect, typeof Sun> = {
  natale: Sparkles,
};

const pill =
  "flex h-9 items-center gap-2 rounded-full px-3.5 text-[0.75rem] font-medium transition-colors duration-500 [transition-timing-function:var(--ease-skin)]";
const idle = "text-ink/70 hover:bg-[rgb(37_39_33_/_0.05)] hover:text-ink";

/**
 * Demo-only overrides for the season (`lib/seasons.ts`) and the festive effects
 * (`lib/effects.ts`). Drop this component from the page and the site keeps
 * following the calendar on its own.
 */
export function DemoControls() {
  const { season, setSeason } = useSeason();
  const { effect, toggle } = useEffects();

  return (
    <div className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2 sm:bottom-6 sm:left-[var(--gutter)] sm:translate-x-0">
      <div className="flex items-center gap-1 rounded-full border border-[rgb(37_39_33_/_0.08)] bg-paper/85 p-1 shadow-[var(--shadow-lift)] [backdrop-filter:blur(18px)] [-webkit-backdrop-filter:blur(18px)]">
        <span
          aria-hidden
          className="hidden pr-1 pl-3 text-[0.625rem] font-medium tracking-[0.16em] text-muted uppercase sm:block"
        >
          Demo
        </span>

        <div role="group" aria-label="Stagione del sito (demo)" className="flex items-center gap-1">
          {seasonOrder.map((id) => {
            const Icon = seasonIcons[id];
            const active = id === season;

            return (
              <button
                key={id}
                type="button"
                onClick={() => setSeason(id)}
                aria-pressed={active}
                aria-label={seasons[id].label}
                className={`${pill} ${active ? "bg-accent text-surface" : idle}`}
              >
                <Icon className="size-[15px] shrink-0" strokeWidth={1.6} aria-hidden />
                <span className="hidden sm:inline">{seasons[id].short}</span>
              </button>
            );
          })}
        </div>

        <span aria-hidden className="mx-1 h-6 w-px shrink-0 bg-[rgb(37_39_33_/_0.12)]" />

        <div role="group" aria-label="Effetti del sito (demo)" className="flex items-center gap-1">
          {effectOrder.map((id) => {
            const Icon = effectIcons[id];
            const active = id === effect;

            return (
              <button
                key={id}
                type="button"
                onClick={() => toggle(id)}
                aria-pressed={active}
                aria-label={effects[id].label}
                className={`${pill} ${active ? "bg-accent text-surface" : idle}`}
              >
                <Icon className="size-[15px] shrink-0" strokeWidth={1.6} aria-hidden />
                <span className="hidden sm:inline">{effects[id].short}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
