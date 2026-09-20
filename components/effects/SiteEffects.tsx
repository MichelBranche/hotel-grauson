"use client";

import { Snowfall } from "@/components/effects/Snowfall";
import { useEffects } from "@/components/providers/EffectsProvider";

/** Page-level decorations. The navbar garland lives inside the navbar itself. */
export function SiteEffects() {
  const { snow } = useEffects();

  return snow ? <Snowfall /> : null;
}
