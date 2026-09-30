import { COUNTRIES, countryLabel, foldPlace, normalizeCountry } from "@pms-core/data/countries";
import { PROVINCES } from "@pms-core/data/provinces";

export type PlaceHit = {
  label: string;
  value: string;
  province?: string;
  cap?: string;
};

export function rankPlaceHits(query: string, items: PlaceHit[], limit = 8) {
  const folded = foldPlace(query.trim());
  if (folded.length < 1) return [];
  const ranked: { hit: PlaceHit; score: number }[] = [];
  for (const hit of items) {
    const label = foldPlace(hit.label);
    const value = foldPlace(hit.value);
    let score = 0;
    if (label === folded || value === folded) score = 400;
    else if (label.startsWith(folded) || value.startsWith(folded)) score = 300;
    else if (label.includes(folded) || value.includes(folded)) score = 200;
    else if (folded.length >= 2 && fuzzy(label, folded)) score = 100;
    if (score) ranked.push({ hit, score });
  }
  ranked.sort((a, b) => b.score - a.score || a.hit.label.localeCompare(b.hit.label, "it"));
  return ranked.slice(0, limit).map((item) => item.hit);
}

function fuzzy(label: string, query: string) {
  let index = 0;
  for (const char of label) {
    if (char === query[index]) index += 1;
    if (index === query.length) return true;
  }
  return false;
}

export function countryHits(query: string) {
  return rankPlaceHits(
    query,
    COUNTRIES.map((country) => ({ label: country.name, value: country.code })),
  );
}

export function provinceHits(query: string) {
  return rankPlaceHits(
    query,
    PROVINCES.map((province) => ({ label: `${province.name} (${province.sigla})`, value: province.sigla })),
  );
}

export function comuneHits(query: string, rows: [string, string, string][]) {
  return rankPlaceHits(
    query,
    rows.map(([name, province, cap]) => ({
      label: `${name} (${province})`,
      value: name,
      province,
      cap: cap || undefined,
    })),
  );
}

export function normalizeProvince(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const folded = foldPlace(trimmed);
  const bySigla = PROVINCES.find((province) => foldPlace(province.sigla) === folded);
  if (bySigla) return bySigla.sigla;
  const byName = PROVINCES.find((province) => foldPlace(province.name) === folded || foldPlace(`${province.name} (${province.sigla})`) === folded);
  return byName?.sigla ?? trimmed;
}

export function provinceLabel(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const sigla = normalizeProvince(trimmed);
  const found = PROVINCES.find((province) => province.sigla === sigla);
  return found ? `${found.name} (${found.sigla})` : trimmed;
}

export { countryLabel, normalizeCountry };
