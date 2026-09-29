"use client";

import { Suspense, createContext, useContext, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { type Season, parseSeasonOverride, photoSeason, seasons } from "@/lib/seasons";

type SeasonContextValue = {
  season: Season;
  media: (typeof seasons)[ReturnType<typeof photoSeason>]["media"];
};

const SeasonContext = createContext<SeasonContextValue | null>(null);

/**
 * Hidden QA override: `?season=inverno|primavera|estate|autunno`.
 * No chrome. Absent or unknown values leave the calendar season in place.
 */
function SeasonQuery({
  calendar,
  onSeason,
}: {
  calendar: Season;
  onSeason: (season: Season) => void;
}) {
  const params = useSearchParams();
  const raw = params.get("season");

  useEffect(() => {
    onSeason(parseSeasonOverride(raw) ?? calendar);
  }, [raw, calendar, onSeason]);

  return null;
}

export function SeasonProvider({
  initialSeason,
  children,
}: {
  initialSeason: Season;
  children: React.ReactNode;
}) {
  const [season, setSeason] = useState(initialSeason);

  // Accent tokens are CSS, keyed off `[data-season]` on <html>. The attribute
  // uses the photograph set, so primavera (estate photos) keeps the estate accent.
  useEffect(() => {
    document.documentElement.dataset.season = photoSeason(season);
  }, [season]);

  const value = useMemo(
    () => ({ season, media: seasons[photoSeason(season)].media }),
    [season],
  );

  return (
    <SeasonContext value={value}>
      <Suspense fallback={null}>
        <SeasonQuery calendar={initialSeason} onSeason={setSeason} />
      </Suspense>
      {children}
    </SeasonContext>
  );
}

export function useSeason() {
  const value = useContext(SeasonContext);
  if (!value) throw new Error("useSeason must be used inside <SeasonProvider>");
  return value;
}
