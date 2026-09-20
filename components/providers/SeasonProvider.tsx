"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { type Season, seasons } from "@/lib/seasons";

type SeasonContextValue = {
  season: Season;
  media: (typeof seasons)[Season]["media"];
  setSeason: (season: Season) => void;
};

const SeasonContext = createContext<SeasonContextValue | null>(null);

export function SeasonProvider({
  initialSeason,
  children,
}: {
  initialSeason: Season;
  children: React.ReactNode;
}) {
  const [season, setSeason] = useState(initialSeason);

  // The accent tokens are CSS, keyed off `[data-season]` on <html>. The server
  // already rendered the initial value there; this only follows later changes.
  useEffect(() => {
    document.documentElement.dataset.season = season;
  }, [season]);

  const value = useMemo(
    () => ({ season, media: seasons[season].media, setSeason }),
    [season],
  );

  return <SeasonContext value={value}>{children}</SeasonContext>;
}

export function useSeason() {
  const value = useContext(SeasonContext);
  if (!value) throw new Error("useSeason must be used inside <SeasonProvider>");
  return value;
}
