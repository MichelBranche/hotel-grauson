"use client";

import { createContext, useContext, useMemo, useState } from "react";

import { type Effect, effects } from "@/lib/effects";

type EffectsContextValue = {
  effect: Effect | null;
  snow: boolean;
  lights: boolean;
  toggle: (effect: Effect) => void;
};

const EffectsContext = createContext<EffectsContextValue | null>(null);

export function EffectsProvider({ children }: { children: React.ReactNode }) {
  const [effect, setEffect] = useState<Effect | null>(null);

  const value = useMemo(() => {
    const active = effect ? effects[effect] : null;

    return {
      effect,
      snow: active?.snow ?? false,
      lights: active?.lights ?? false,
      toggle: (next: Effect) => setEffect((current) => (current === next ? null : next)),
    };
  }, [effect]);

  return <EffectsContext value={value}>{children}</EffectsContext>;
}

export function useEffects() {
  const value = useContext(EffectsContext);
  if (!value) throw new Error("useEffects must be used inside <EffectsProvider>");
  return value;
}
