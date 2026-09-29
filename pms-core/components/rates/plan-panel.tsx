"use client";

import { useState } from "react";
import { toast } from "sonner";

import { createDefaultRatePlanAction, deleteRatePlanAction, setRatePlanPricesAction } from "@pms-core/actions/rates";
import { PlanForm } from "@pms-core/components/rates/plan-form";
import { numberOrNull, numberText, type PlanView, type RoomTypeView } from "@pms-core/components/rates/types";
import { StatusBadge } from "@pms-core/components/ui/badge";
import { Button } from "@pms-core/components/ui/button";
import { ConfirmDialog, Dialog } from "@pms-core/components/ui/dialog";
import { EmptyState } from "@pms-core/components/ui/empty-state";
import { Input } from "@pms-core/components/ui/input";
import { formatMoney } from "@pms-core/lib/money";

export function PlanPanel({ plans, roomTypes, canWrite }: { plans: PlanView[]; roomTypes: RoomTypeView[]; canWrite: boolean }) {
  const [editing, setEditing] = useState<PlanView | "new" | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PlanView | null>(null);
  const [creatingDefault, setCreatingDefault] = useState(false);

  return (
    <section className="space-y-3" aria-labelledby="piani-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="piani-title" className="text-lg">
            Piani tariffari
          </h2>
          <p className="text-sm text-[var(--pms-muted)]">Prezzo base a notte per tipologia, valido fuori dalle stagioni.</p>
        </div>
        {canWrite && plans.length ? <Button onClick={() => setEditing("new")}>Nuovo piano</Button> : null}
      </div>

      {plans.length === 0 ? (
        <div className="space-y-3">
          <EmptyState
            title="Nessun piano tariffario"
            body="Senza un piano attivo nessuna camera è vendibile, né in PMS né sul sito. Crea la tariffa standard: i prezzi partono dal prezzo base di ogni tipologia."
          />
          {canWrite ? (
            <div className="flex justify-center">
              <Button
                disabled={creatingDefault}
                onClick={async () => {
                  setCreatingDefault(true);
                  const result = await createDefaultRatePlanAction();
                  setCreatingDefault(false);
                  if (!result.ok) toast.error(result.error);
                  else toast.success("Tariffa standard creata.");
                }}
              >
                {creatingDefault ? "Creazione…" : "Crea tariffa standard"}
              </Button>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="grid gap-3 xl:grid-cols-2">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              roomTypes={roomTypes}
              canWrite={canWrite}
              onEdit={() => setEditing(plan)}
              onDelete={() => setPendingDelete(plan)}
            />
          ))}
        </div>
      )}

      <Dialog
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        title={editing && editing !== "new" ? `Modifica ${editing.name}` : "Nuovo piano tariffario"}
        description="Regole generali della tariffa. I prezzi per tipologia si impostano sulla scheda del piano."
        flush
        className="w-[min(620px,calc(100vw-1.5rem))]"
      >
        {editing ? (
          <PlanForm key={editing === "new" ? "new" : editing.id} plan={editing === "new" ? undefined : editing} onDone={() => setEditing(null)} />
        ) : null}
      </Dialog>

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Eliminare il piano tariffario?"
        description={
          pendingDelete
            ? `«${pendingDelete.name}» e le sue stagioni dedicate verranno eliminate. Se ha prenotazioni collegate l'eliminazione viene rifiutata: in quel caso disattivalo.`
            : ""
        }
        confirmLabel="Elimina"
        danger
        onConfirm={() => {
          if (!pendingDelete) return;
          void deleteRatePlanAction(pendingDelete.id).then((result) => {
            if (!result.ok) toast.error(result.error);
            else toast.success("Piano tariffario eliminato.");
          });
        }}
      />
    </section>
  );
}

function PlanCard({
  plan,
  roomTypes,
  canWrite,
  onEdit,
  onDelete,
}: {
  plan: PlanView;
  roomTypes: RoomTypeView[];
  canWrite: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const initial = Object.fromEntries(roomTypes.map((type) => [type.id, numberText(plan.prices[type.id])]));
  const [prices, setPrices] = useState<Record<string, string>>(initial);
  const [saving, setSaving] = useState(false);
  const dirty = roomTypes.some((type) => (prices[type.id] ?? "") !== (initial[type.id] ?? ""));
  const invalid = roomTypes.find((type) => {
    const value = numberOrNull(prices[type.id] ?? "");
    return value !== null && (!Number.isFinite(value) || value < 0);
  });

  return (
    <article className="pms-card flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs tracking-[0.16em] text-[var(--pms-muted)] uppercase">{plan.code}</p>
          <h3 className="text-lg font-semibold">{plan.name}</h3>
        </div>
        <StatusBadge label={plan.active ? "Attiva" : "Disattivata"} tone={plan.active ? "green" : "stone"} />
      </div>
      <p className="mt-2 text-sm text-[var(--pms-muted)]">
        {plan.isRefundable ? "Rimborsabile" : "Non rimborsabile"} · min. {plan.minimumStay} {plan.minimumStay === 1 ? "notte" : "notti"}
        {plan.maximumStay ? ` · max. ${plan.maximumStay}` : ""}
        {plan.depositPercent ? ` · acconto ${plan.depositPercent}%` : ""}
      </p>
      {plan.cancellationPolicy ? <p className="mt-1 text-xs text-[var(--pms-muted)]">{plan.cancellationPolicy}</p> : null}

      {roomTypes.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--pms-muted)]">Crea prima le tipologie in Camere.</p>
      ) : (
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-[var(--pms-muted)]">
              <th className="pb-2 font-normal">Tipologia</th>
              <th className="pb-2 text-right font-normal">Prezzo a notte</th>
            </tr>
          </thead>
          <tbody>
            {roomTypes.map((type) => (
              <tr key={type.id} className="border-t border-[var(--pms-line)]">
                <td className="py-2 pr-3">
                  {type.name}
                  {!type.active ? <span className="ml-2 text-xs text-[var(--pms-muted)]">disattivata</span> : null}
                </td>
                <td className="py-1.5">
                  {canWrite ? (
                    <div className="relative ml-auto w-32">
                      <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-[var(--pms-muted)]">€</span>
                      <Input
                        type="number"
                        min={0}
                        step="1"
                        inputMode="decimal"
                        aria-label={`Prezzo ${type.name}`}
                        value={prices[type.id] ?? ""}
                        placeholder={type.basePrice > 0 ? String(type.basePrice) : "—"}
                        onChange={(event) => setPrices((current) => ({ ...current, [type.id]: event.target.value }))}
                        className="h-9 pl-7 text-right tabular-nums"
                      />
                    </div>
                  ) : (
                    <span className="block text-right tabular-nums">
                      {plan.prices[type.id] !== undefined ? formatMoney(plan.prices[type.id]) : type.basePrice > 0 ? formatMoney(type.basePrice) : "—"}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {canWrite ? (
        <p className="mt-2 text-xs text-[var(--pms-muted)]">Campo vuoto = prezzo base della tipologia (in grigio).</p>
      ) : null}
      {invalid ? <p className="mt-2 text-xs text-[#8a3b3b]">Il prezzo di {invalid.name} non è valido.</p> : null}

      {canWrite ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            size="sm"
            disabled={!dirty || saving || Boolean(invalid)}
            onClick={async () => {
              setSaving(true);
              const result = await setRatePlanPricesAction(
                plan.id,
                roomTypes.map((type) => ({ roomTypeId: type.id, basePrice: numberOrNull(prices[type.id] ?? "") })),
              );
              setSaving(false);
              if (!result.ok) toast.error(result.error);
              else toast.success(`Prezzi di ${plan.name} salvati.`);
            }}
          >
            {saving ? "Salvataggio…" : "Salva prezzi"}
          </Button>
          <Button size="sm" variant="outline" onClick={onEdit}>
            Modifica regole
          </Button>
          <Button size="sm" variant="ghost" onClick={onDelete}>
            Elimina
          </Button>
        </div>
      ) : null}
    </article>
  );
}
