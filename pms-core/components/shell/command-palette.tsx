"use client";

import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { searchAction } from "@pms-core/actions/lookups";

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Awaited<ReturnType<typeof searchAction>> | null>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open || query.trim().length < 2) return;
    const id = window.setTimeout(async () => {
      setResults(await searchAction(query));
    }, 180);
    return () => window.clearTimeout(id);
  }, [query, open]);

  if (!open) return null;

  const groups = results?.ok ? results.data : { guests: [], reservations: [], rooms: [] };

  return (
    <div className="fixed inset-0 z-[70] bg-[rgb(37_39_33_/_0.28)] p-4" onClick={() => onOpenChange(false)}>
      <Command
        className="mx-auto mt-[12vh] w-full max-w-xl overflow-hidden rounded-[24px] border border-[var(--pms-line)] bg-[var(--pms-surface)] shadow-[var(--pms-shadow)]"
        onClick={(event) => event.stopPropagation()}
      >
        <Command.Input
          autoFocus
          value={query}
          onValueChange={setQuery}
          placeholder="Cerca Rossi, BK-2026, camera 101…"
          className="h-14 w-full border-b border-[var(--pms-line)] bg-transparent px-5 text-sm outline-none"
        />
        <Command.List className="max-h-80 overflow-auto p-2">
          <Command.Empty className="px-3 py-8 text-center text-sm text-[var(--pms-muted)]">
            Nessun risultato.
          </Command.Empty>
          {[
            { heading: "Ospiti", items: groups.guests },
            { heading: "Prenotazioni", items: groups.reservations },
            { heading: "Camere", items: groups.rooms },
          ].map((group) =>
            group.items.length ? (
              <Command.Group key={group.heading} heading={group.heading} className="px-2 py-1 text-xs text-[var(--pms-muted)]">
                {group.items.map((item) => (
                  <Command.Item
                    key={item.id}
                    value={`${item.label} ${item.hint}`}
                    className="flex cursor-pointer flex-col rounded-xl px-3 py-2 text-[var(--pms-text)] data-[selected=true]:bg-[var(--pms-surface-dark)]"
                    onSelect={() => {
                      router.push(item.href);
                      onOpenChange(false);
                    }}
                  >
                    <span className="text-sm">{item.label}</span>
                    <span className="text-xs text-[var(--pms-muted)]">{item.hint}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            ) : null,
          )}
        </Command.List>
      </Command>
    </div>
  );
}
