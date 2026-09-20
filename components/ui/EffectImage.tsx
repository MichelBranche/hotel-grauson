"use client";

import Image from "next/image";
import { useState } from "react";

import { useEffects } from "@/components/providers/EffectsProvider";
import { type Effect, type EffectSlot, effects } from "@/lib/effects";

const FADE_MS = 900;

type Photo = { src: string; alt: string };

/**
 * A `fill` image that swaps to the festive photograph when that effect is on.
 *
 * Same crossfade as `SeasonalImage`: the incoming frame sits on top and only
 * appears once decoded. Needs a positioned parent.
 */
export function EffectImage({
  src,
  alt,
  slot,
  sizes,
  className = "",
  priority,
  quality,
}: {
  src: string;
  alt: string;
  slot: EffectSlot;
  sizes: string;
  className?: string;
  priority?: boolean;
  quality?: number;
}) {
  const { effect } = useEffects();
  const [settled, setSettled] = useState<Effect | null>(effect);
  const [decoded, setDecoded] = useState<Effect | null | "off">(null);

  const base: Photo = settled ? effects[settled].media[slot] : { src, alt };
  const incoming: Photo | null =
    effect === settled ? null : effect ? effects[effect].media[slot] : { src, alt };

  return (
    <>
      <Image
        src={base.src}
        alt={base.alt}
        fill
        sizes={sizes}
        priority={priority}
        quality={quality}
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
          onLoad={() => {
            const next = effect;
            setDecoded(next ?? "off");
            window.setTimeout(() => setSettled(next), FADE_MS + 60);
          }}
          style={{ transitionDuration: `${FADE_MS}ms` }}
          className={`${className} transition-opacity [transition-timing-function:var(--ease-skin)] ${
            decoded === (effect ?? "off") ? "opacity-100" : "opacity-0"
          }`}
        />
      ) : null}
    </>
  );
}
