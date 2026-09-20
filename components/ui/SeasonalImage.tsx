"use client";

import Image from "next/image";
import { useState } from "react";

import { useSeason } from "@/components/providers/SeasonProvider";
import { type Season, type SeasonSlot, seasons } from "@/lib/seasons";

const FADE_MS = 900;

/**
 * A `fill` image that follows the active season.
 *
 * The incoming photograph is stacked over the one on screen and only revealed
 * once it has decoded, so switching season is a crossfade rather than a frame
 * of empty box. Needs a positioned parent, like any `fill` image.
 */
export function SeasonalImage({
  slot,
  sizes,
  className = "",
  priority,
  quality,
  unoptimized,
}: {
  slot: SeasonSlot;
  sizes: string;
  className?: string;
  priority?: boolean;
  quality?: number;
  unoptimized?: boolean;
}) {
  const { season } = useSeason();
  const [settled, setSettled] = useState<Season>(season);
  const [decoded, setDecoded] = useState<Season | null>(null);

  const base = seasons[settled].media[slot];
  const incoming = season === settled ? null : seasons[season].media[slot];

  return (
    <>
      <Image
        src={base.src}
        alt={base.alt}
        fill
        sizes={sizes}
        priority={priority}
        quality={quality}
        unoptimized={unoptimized}
        className={className}
      />

      {incoming ? (
        <Image
          key={incoming.src}
          src={incoming.src}
          alt=""
          aria-hidden
          fill
          sizes={sizes}
          quality={quality}
          unoptimized={unoptimized}
          onLoad={() => {
            setDecoded(season);
            // Hand the layer over after the fade: `transitionend` never fires
            // when a cached image paints opaque on its first frame.
            window.setTimeout(() => setSettled(season), FADE_MS + 60);
          }}
          style={{ transitionDuration: `${FADE_MS}ms` }}
          className={`${className} transition-opacity [transition-timing-function:var(--ease-skin)] ${
            decoded === season ? "opacity-100" : "opacity-0"
          }`}
        />
      ) : null}
    </>
  );
}
