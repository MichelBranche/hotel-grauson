/**
 * Italian municipalities, lazy-loaded so the PMS shell does not parse the list at startup.
 * Rows are [name, province sigla, single CAP or ""]. CAP is set only when the source lists one code.
 * Derived from the public comuni-json dataset (MIT).
 */
export type ComuneRow = [name: string, province: string, cap: string];

let loading: Promise<ComuneRow[]> | null = null;

export function loadComuni() {
  loading ??= import("@pms-core/data/comuni.json").then((mod) => mod.default as ComuneRow[]);
  return loading;
}
