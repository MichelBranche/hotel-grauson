"use client";

import { Popover as PopoverPrimitive } from "radix-ui";
import { useId, useRef, useState } from "react";

import { loadComuni, type ComuneRow } from "@pms-core/data/comuni";
import { countryLabel, normalizeCountry } from "@pms-core/data/countries";
import { comuneHits, countryHits, normalizeProvince, provinceHits, provinceLabel, type PlaceHit } from "@pms-core/lib/place-suggest";
import { cn } from "@pms-core/lib/utils";

type PlaceKind = "country" | "comune" | "province" | "birthplace";

export function PlaceField({
  value,
  onValueChange,
  kind,
  required,
  placeholder,
}: {
  value: string;
  onValueChange: (value: string, extra?: { province?: string; cap?: string }) => void;
  kind: PlaceKind;
  required?: boolean;
  placeholder?: string;
}) {
  const listId = useId();
  const picked = useRef(false);
  const [query, setQuery] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [comuni, setComuni] = useState<ComuneRow[] | null>(null);
  const editing = query !== null;
  const text = editing ? query : labelFor(kind, value);
  const hits = suggestions(kind, text, comuni);
  const shown = open && text.trim().length > 0;

  function ensureComuni() {
    if (kind !== "comune" && kind !== "birthplace") return;
    if (comuni) return;
    void loadComuni().then(setComuni);
  }

  function choose(hit: PlaceHit) {
    picked.current = true;
    setQuery(null);
    setOpen(false);
    onValueChange(hit.value, { province: hit.province, cap: hit.cap });
  }

  function commit(next: string) {
    if (picked.current) {
      picked.current = false;
      setQuery(null);
      setOpen(false);
      return;
    }
    setQuery(null);
    setOpen(false);
    if (kind === "country") onValueChange(normalizeCountry(next));
    else if (kind === "province") onValueChange(normalizeProvince(next));
    else onValueChange(next.trim());
  }

  return (
    <PopoverPrimitive.Root open={shown}>
      <PopoverPrimitive.Anchor asChild>
        <input
          className={cn(
            "h-10 w-full rounded-2xl border border-[var(--pms-line)] bg-white px-3 text-sm outline-none transition-[border-color,box-shadow] placeholder:text-[var(--pms-muted)] focus:border-[var(--pms-alpine)] focus:shadow-[0_0_0_3px_rgb(38_50_41_/_0.1)]",
          )}
          role="combobox"
          aria-expanded={shown}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={shown && hits[active] ? `${listId}-${active}` : undefined}
          autoComplete="off"
          required={required}
          placeholder={placeholder}
          value={text}
          onFocus={() => {
            setQuery(labelFor(kind, value));
            setOpen(true);
            setActive(0);
            ensureComuni();
          }}
          onBlur={() => commit(query ?? text)}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            setActive(0);
            ensureComuni();
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setOpen(true);
              setActive((current) => Math.min(current + 1, Math.max(hits.length - 1, 0)));
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActive((current) => Math.max(current - 1, 0));
            } else if (event.key === "Enter" && shown && hits[active]) {
              event.preventDefault();
              choose(hits[active]);
            } else if (event.key === "Escape") {
              setOpen(false);
            }
          }}
        />
      </PopoverPrimitive.Anchor>
      {shown ? (
        <PopoverPrimitive.Portal container={typeof document === "undefined" ? undefined : document.querySelector<HTMLElement>("[data-pms]") ?? undefined}>
          <PopoverPrimitive.Content
            id={listId}
            role="listbox"
            align="start"
            sideOffset={4}
            onOpenAutoFocus={(event) => event.preventDefault()}
            onCloseAutoFocus={(event) => event.preventDefault()}
            className="z-[80] max-h-56 w-[var(--radix-popover-trigger-width)] overflow-auto rounded-2xl border border-[var(--pms-line)] bg-[var(--pms-surface)] p-1 shadow-[var(--pms-shadow)]"
          >
            {hits.length === 0 ? (
              <p className="px-3 py-2 text-sm text-[var(--pms-muted)]">Nessuna corrispondenza. Il testo inserito resta valido.</p>
            ) : (
              hits.map((hit, index) => (
                <button
                  key={`${hit.value}-${hit.province ?? ""}-${index}`}
                  id={`${listId}-${index}`}
                  type="button"
                  role="option"
                  aria-selected={index === active}
                  className={cn("block w-full rounded-xl px-3 py-2 text-left text-sm", index === active && "bg-[var(--pms-surface-dark)]")}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => choose(hit)}
                >
                  {hit.label}
                </button>
              ))
            )}
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      ) : null}
    </PopoverPrimitive.Root>
  );
}

function labelFor(kind: PlaceKind, value: string) {
  if (kind === "country") return countryLabel(value);
  if (kind === "province") return provinceLabel(value);
  return value;
}

function suggestions(kind: PlaceKind, text: string, comuni: ComuneRow[] | null) {
  if (kind === "country") return countryHits(text);
  if (kind === "province") return provinceHits(text);
  if (!comuni) return [];
  return comuneHits(text, comuni);
}
