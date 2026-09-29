"use client";

import { useState } from "react";
import { toast } from "sonner";

import { deleteSeasonAction } from "@pms-core/actions/rates";
import { SeasonForm } from "@pms-core/components/rates/season-form";
import type { PlanView, RoomTypeView, SeasonView } from "@pms-core/components/rates/types";
import { StatusBadge } from "@pms-core/components/ui/badge";
import { Button } from "@pms-core/components/ui/button";
import { ConfirmDialog, Dialog } from "@pms-core/components/ui/dialog";
import { EmptyState } from "@pms-core/components/ui/empty-state";
import { formatShort, nightsBetween } from "@pms-core/lib/dates";
import { formatMoney } from "@pms-core/lib/money";

export function SeasonPanel({
  seasons,
  plans,
  roomTypes,
  today,
  canWrite,
}: {
  seasons: SeasonView[];
  plans: PlanView[];
  roomTypes: RoomTypeView[];
  today: string;
  canWrite: boolean;
}) {
  const [editing, setEditing] = useState<SeasonView | "new" | null>(null);
  const [pendingDelete, setPendingDelete] = useState<SeasonView | null>(null);
  const [showPast, setShowPast] = useState(false);

  const past = seasons.filter((season) => season.endDate < today);
  const visible = showPast ? seasons : seasons.filter((season) => season.endDate >= today);

  return (
    <section className="space-y-3" aria-labelledby="stagioni-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="stagioni-title" className="text-lg">
            Stagioni e periodi
          </h2>
          <p className="text-sm text-[var(--pms-muted)]">
            Prezzi e regole per un intervallo di notti. Le stagioni non possono sovrapporsi sulla stessa tariffa.
          </p>
        </div>
        <div className="flex gap-2">
          {past.length ? (
            <Button variant="ghost" size="sm" onClick={() => setShowPast((value) => !value)}>
              {showPast ? "Nascondi passate" : `Mostra passate (${past.length})`}
            </Button>
          ) : null}
          {canWrite ? (
            <Button onClick={() => setEditing("new")} disabled={!plans.length} title={plans.length ? undefined : "Crea prima un piano tariffario"}>
              Nuova stagione
            </Button>
          ) : null}
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          title="Nessuna stagione in programma"
          body="Fuori dalle stagioni vale il prezzo base del piano. Crea ad esempio «Natale» dal 20 dicembre al 6 gennaio con prezzo più alto e minimo 3 notti."
        />
      ) : (
        <ul className="pms-card divide-y divide-[var(--pms-line)] overflow-hidden p-0">
          {visible.map((season) => {
            const nights = nightsBetween(season.startDate, season.endDate) + 1;
            const current = season.startDate <= today && season.endDate >= today;
            const priced = roomTypes.filter((type) => season.prices[type.id] !== undefined);
            return (
              <li key={season.id} className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-[var(--pms-hover)] md:flex-row md:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{season.name}</p>
                    {current ? <StatusBadge label="In corso" tone="green" /> : null}
                    {season.endDate < today ? <StatusBadge label="Passata" tone="stone" /> : null}
                    <StatusBadge label={season.ratePlanName ?? "Tutte le tariffe"} tone="blue" />
                  </div>
                  <p className="mt-1 text-sm text-[var(--pms-muted)] tabular-nums">
                    {formatShort(season.startDate)} – {formatShort(season.endDate)} {season.endDate.slice(0, 4)} · {nights}{" "}
                    {nights === 1 ? "notte" : "notti"}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {season.minStay ? <StatusBadge label={`Min. ${season.minStay} notti`} tone="amber" /> : null}
                    {season.maxStay ? <StatusBadge label={`Max. ${season.maxStay} notti`} tone="amber" /> : null}
                    {season.closedToArrival ? <StatusBadge label="Chiuso agli arrivi" tone="rose" /> : null}
                    {season.closedToDeparture ? <StatusBadge label="Chiuso alle partenze" tone="rose" /> : null}
                  </div>
                </div>
                <div className="text-sm md:w-64">
                  {priced.length ? (
                    <ul className="space-y-0.5">
                      {priced.map((type) => (
                        <li key={type.id} className="flex justify-between gap-3">
                          <span className="truncate text-[var(--pms-muted)]">{type.name}</span>
                          <span className="tabular-nums">{formatMoney(season.prices[type.id])}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[var(--pms-muted)]">Prezzi base, solo regole di soggiorno.</p>
                  )}
                </div>
                {canWrite ? (
                  <div className="flex gap-2 md:justify-end">
                    <Button size="sm" variant="outline" onClick={() => setEditing(season)}>
                      Modifica
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setPendingDelete(season)}>
                      Elimina
                    </Button>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      <Dialog
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        title={editing && editing !== "new" ? `Modifica ${editing.name}` : "Nuova stagione"}
        description="Vale per le nuove prenotazioni e le ricerche. Le prenotazioni già registrate mantengono il loro prezzo."
        flush
        className="w-[min(640px,calc(100vw-1.5rem))]"
      >
        {editing ? (
          <SeasonForm
            key={editing === "new" ? "new" : editing.id}
            season={editing === "new" ? undefined : editing}
            plans={plans}
            roomTypes={roomTypes}
            onDone={() => setEditing(null)}
          />
        ) : null}
      </Dialog>

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Eliminare la stagione?"
        description={
          pendingDelete
            ? `Dal ${formatShort(pendingDelete.startDate)} al ${formatShort(pendingDelete.endDate)} torneranno prezzi e regole del piano base. Le prenotazioni già registrate non cambiano.`
            : ""
        }
        confirmLabel="Elimina"
        danger
        onConfirm={() => {
          if (!pendingDelete) return;
          void deleteSeasonAction(pendingDelete.id).then((result) => {
            if (!result.ok) toast.error(result.error);
            else toast.success("Stagione eliminata.");
          });
        }}
      />
    </section>
  );
}
