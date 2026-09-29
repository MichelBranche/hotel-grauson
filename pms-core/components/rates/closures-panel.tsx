"use client";

import { useState } from "react";
import { toast } from "sonner";

import { createClosureAction, deleteRoomBlockAction, reopenRoomTypeAction, updateRoomBlockAction } from "@pms-core/actions/rates";
import { issuesByField } from "@pms-core/components/rates/types";
import { StatusBadge } from "@pms-core/components/ui/badge";
import { Button } from "@pms-core/components/ui/button";
import { ConfirmDialog, Dialog } from "@pms-core/components/ui/dialog";
import { EmptyState } from "@pms-core/components/ui/empty-state";
import { Field, Input, Select } from "@pms-core/components/ui/input";
import { formatShort, nightsBetween } from "@pms-core/lib/dates";
import { closureInputSchema } from "@pms-core/lib/rates";
import { cn } from "@pms-core/lib/utils";

type TypeClosure = { roomTypeId: string; roomTypeName: string; startDate: string; endDate: string; nights: number };
type RoomBlockView = {
  id: string;
  roomId: string;
  roomNumber: string;
  roomTypeName: string;
  startDate: string;
  endDate: string;
  reason: string;
};

type Editing = { kind: "new" } | { kind: "block"; block: RoomBlockView };

function range(startDate: string, endDate: string) {
  const nights = nightsBetween(startDate, endDate) + 1;
  return `${formatShort(startDate)} – ${formatShort(endDate)} ${endDate.slice(0, 4)} · ${nights} ${nights === 1 ? "notte" : "notti"}`;
}

export function ClosuresPanel({
  typeClosures,
  roomBlocks,
  roomTypes,
  rooms,
  canWrite,
}: {
  typeClosures: TypeClosure[];
  roomBlocks: RoomBlockView[];
  roomTypes: { id: string; name: string }[];
  rooms: { id: string; number: string; roomTypeName: string }[];
  canWrite: boolean;
}) {
  const [editing, setEditing] = useState<Editing | null>(null);
  const [pendingReopen, setPendingReopen] = useState<TypeClosure | null>(null);
  const [pendingDelete, setPendingDelete] = useState<RoomBlockView | null>(null);

  const empty = typeClosures.length === 0 && roomBlocks.length === 0;

  return (
    <section className="space-y-3" aria-labelledby="chiusure-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="chiusure-title" className="text-lg">
            Chiusure
          </h2>
          <p className="text-sm text-[var(--pms-muted)]">
            Togli dalla vendita una tipologia intera o una singola camera per alcune notti. Vale per planning e sito.
          </p>
        </div>
        {canWrite ? <Button onClick={() => setEditing({ kind: "new" })}>Nuova chiusura</Button> : null}
      </div>

      {empty ? (
        <EmptyState title="Nessuna chiusura in programma" body="Tutte le camere attive sono vendibili. Le chiusure passate non vengono mostrate." />
      ) : (
        <ul className="pms-card divide-y divide-[var(--pms-line)] overflow-hidden p-0">
          {typeClosures.map((closure) => (
            <li
              key={`${closure.roomTypeId}:${closure.startDate}`}
              className="flex flex-col gap-2 px-5 py-4 transition-colors hover:bg-[var(--pms-hover)] sm:flex-row sm:items-center"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{closure.roomTypeName}</p>
                  <StatusBadge label="Tipologia chiusa" tone="rose" />
                </div>
                <p className="mt-1 text-sm text-[var(--pms-muted)] tabular-nums">{range(closure.startDate, closure.endDate)}</p>
              </div>
              {canWrite ? (
                <Button size="sm" variant="outline" onClick={() => setPendingReopen(closure)}>
                  Riapri
                </Button>
              ) : null}
            </li>
          ))}
          {roomBlocks.map((block) => (
            <li key={block.id} className="flex flex-col gap-2 px-5 py-4 transition-colors hover:bg-[var(--pms-hover)] sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">Camera {block.roomNumber}</p>
                  <span className="text-xs text-[var(--pms-muted)]">{block.roomTypeName}</span>
                  <StatusBadge label="Camera chiusa" tone="ink" />
                </div>
                <p className="mt-1 text-sm text-[var(--pms-muted)] tabular-nums">
                  {range(block.startDate, block.endDate)}
                  {block.reason ? ` · ${block.reason}` : ""}
                </p>
              </div>
              {canWrite ? (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditing({ kind: "block", block })}>
                    Modifica
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setPendingDelete(block)}>
                    Riapri
                  </Button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        title={editing?.kind === "block" ? `Chiusura camera ${editing.block.roomNumber}` : "Nuova chiusura"}
        description="Le notti indicate non sono vendibili. Le prenotazioni esistenti non vengono toccate."
        flush
        className="w-[min(560px,calc(100vw-1.5rem))]"
      >
        {editing ? (
          <ClosureForm
            key={editing.kind === "block" ? editing.block.id : "new"}
            block={editing.kind === "block" ? editing.block : undefined}
            roomTypes={roomTypes}
            rooms={rooms}
            onDone={() => setEditing(null)}
          />
        ) : null}
      </Dialog>

      <ConfirmDialog
        open={pendingReopen !== null}
        onOpenChange={(open) => !open && setPendingReopen(null)}
        title="Riaprire la tipologia?"
        description={
          pendingReopen ? `${pendingReopen.roomTypeName} torna vendibile dal ${formatShort(pendingReopen.startDate)} al ${formatShort(pendingReopen.endDate)}.` : ""
        }
        confirmLabel="Riapri"
        onConfirm={async () => {
          if (!pendingReopen) return;
          const result = await reopenRoomTypeAction(pendingReopen.roomTypeId, pendingReopen.startDate, pendingReopen.endDate);
          if (!result.ok) toast.error(result.error, { id: `reopen-${pendingReopen.roomTypeId}` });
          else toast.success(`${pendingReopen.roomTypeName} riaperta.`, { id: `reopen-${pendingReopen.roomTypeId}` });
        }}
      />
      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Riaprire la camera?"
        description={pendingDelete ? `La camera ${pendingDelete.roomNumber} torna vendibile dal ${formatShort(pendingDelete.startDate)} al ${formatShort(pendingDelete.endDate)}.` : ""}
        confirmLabel="Riapri"
        onConfirm={async () => {
          if (!pendingDelete) return;
          const result = await deleteRoomBlockAction(pendingDelete.id);
          if (!result.ok) toast.error(result.error, { id: pendingDelete.id });
          else toast.success(`Camera ${pendingDelete.roomNumber} riaperta.`, { id: pendingDelete.id });
        }}
      />
    </section>
  );
}

function ClosureForm({
  block,
  roomTypes,
  rooms,
  onDone,
}: {
  block?: RoomBlockView;
  roomTypes: { id: string; name: string }[];
  rooms: { id: string; number: string; roomTypeName: string }[];
  onDone: () => void;
}) {
  const [scope, setScope] = useState<"roomType" | "room">(block ? "room" : "roomType");
  const [targetId, setTargetId] = useState(block?.roomId ?? "");
  const [startDate, setStartDate] = useState(block?.startDate ?? "");
  const [endDate, setEndDate] = useState(block?.endDate ?? "");
  const [reason, setReason] = useState(block?.reason ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const nights = startDate && endDate && endDate >= startDate ? nightsBetween(startDate, endDate) + 1 : 0;

  return (
    <form
      className="grid h-full min-h-0 grid-rows-[minmax(0,1fr)_auto]"
      noValidate
      onSubmit={async (event) => {
        event.preventDefault();
        const parsed = closureInputSchema.safeParse({ scope, targetId, startDate, endDate, reason });
        if (!parsed.success) {
          setErrors(issuesByField(parsed.error));
          return;
        }
        setErrors({});
        setPending(true);
        const result = block
          ? await updateRoomBlockAction(block.id, { startDate, endDate, reason })
          : await createClosureAction(parsed.data);
        setPending(false);
        if (!result.ok) {
          setErrors({ form: result.error });
          return;
        }
        toast.success(block ? "Chiusura aggiornata." : "Chiusura salvata.");
        onDone();
      }}
    >
      <div className="min-h-0 space-y-4 overflow-y-auto pms-scroll px-6 py-5">
        {!block ? (
          <div className="grid grid-cols-2 gap-1 rounded-full bg-[var(--pms-surface-dark)] p-1 text-sm" role="radiogroup" aria-label="Cosa chiudere">
            {(
              [
                ["roomType", "Tipologia intera"],
                ["room", "Singola camera"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={scope === value}
                onClick={() => {
                  setScope(value);
                  setTargetId("");
                }}
                className={cn("pms-press h-9 rounded-full", scope === value ? "bg-white shadow-sm" : "text-[var(--pms-muted)] hover:text-[var(--pms-text)]")}
              >
                {label}
              </button>
            ))}
          </div>
        ) : null}

        {!block ? (
          <Field label={scope === "roomType" ? "Tipologia" : "Camera"} error={errors.targetId}>
            <Select value={targetId} onChange={(event) => setTargetId(event.target.value)}>
              <option value="">Seleziona…</option>
              {scope === "roomType"
                ? roomTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))
                : rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.number} · {room.roomTypeName}
                    </option>
                  ))}
            </Select>
          </Field>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Prima notte chiusa" error={errors.startDate}>
            <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
          </Field>
          <Field label="Ultima notte chiusa (inclusa)" error={errors.endDate}>
            <Input type="date" value={endDate} min={startDate || undefined} onChange={(event) => setEndDate(event.target.value)} />
          </Field>
        </div>
        <p className="-mt-2 text-xs text-[var(--pms-muted)]">
          {nights ? `${nights} ${nights === 1 ? "notte" : "notti"} fuori vendita.` : "Per chiudere una sola notte usa la stessa data due volte."}
        </p>

        {scope === "room" ? (
          <Field label="Motivo" error={errors.reason}>
            <Input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Manutenzione, uso proprietario…" maxLength={160} />
          </Field>
        ) : (
          <p className="text-xs leading-5 text-[var(--pms-muted)]">
            Chiude alla vendita tutte le camere della tipologia. Le prenotazioni già presenti restano valide; per spostarle usa il planning.
          </p>
        )}

        {errors.form ? (
          <p role="alert" className="rounded-2xl bg-[rgb(138_59_59_/_0.08)] px-4 py-3 text-sm text-[#8a3b3b]">
            {errors.form}
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 justify-end gap-2 border-t border-[var(--pms-line)] bg-[var(--pms-surface)] px-6 py-4">
        <Button type="button" variant="ghost" onClick={onDone}>
          Annulla
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Salvataggio…" : block ? "Salva" : "Chiudi alla vendita"}
        </Button>
      </div>
    </form>
  );
}
