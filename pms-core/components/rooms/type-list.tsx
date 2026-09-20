"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { deleteRoomTypeAction, duplicateRoomTypeAction, setRoomTypeActiveAction } from "@pms-core/actions/rooms";
import { RoomTypeForm } from "@pms-core/components/rooms/type-form";
import type { StructurePermissions, StructureType } from "@pms-core/components/rooms/types";
import { Button } from "@pms-core/components/ui/button";
import { ConfirmDialog } from "@pms-core/components/ui/dialog";
import { Dialog } from "@pms-core/components/ui/dialog";
import { EmptyState } from "@pms-core/components/ui/empty-state";
import { Input, Select } from "@pms-core/components/ui/input";
import { StatusBadge } from "@pms-core/components/ui/badge";
import { formatMoney } from "@pms-core/lib/money";

export function TypeList({
  types,
  canWrite,
}: {
  types: StructureType[];
  canWrite: StructurePermissions["roomTypes"];
}) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<"all" | "active" | "inactive">("all");
  const [editing, setEditing] = useState<StructureType | null | "new">(null);
  const [pendingDelete, setPendingDelete] = useState<StructureType | null>(null);

  const filtered = useMemo(
    () =>
      types.filter((type) => {
        const hay = `${type.name} ${type.code}`.toLowerCase();
        if (query && !hay.includes(query.toLowerCase())) return false;
        if (active === "active" && !type.active) return false;
        if (active === "inactive" && type.active) return false;
        return true;
      }),
    [types, query, active],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="block flex-1">
          <span className="mb-1.5 block text-xs text-[var(--pms-muted)]">Cerca nome o codice</span>
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Standard, STD…" />
        </label>
        <label className="block sm:w-44">
          <span className="mb-1.5 block text-xs text-[var(--pms-muted)]">Stato</span>
          <Select value={active} onChange={(event) => setActive(event.target.value as typeof active)}>
            <option value="all">Tutte</option>
            <option value="active">Attive</option>
            <option value="inactive">Disattivate</option>
          </Select>
        </label>
        {canWrite ? <Button onClick={() => setEditing("new")}>Nuova tipologia</Button> : null}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Nessuna tipologia" body="Crea la prima tipologia oppure modifica i filtri." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((type) => (
            <article key={type.id} className="pms-card flex flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="pms-title text-lg">{type.name}</p>
                  <p className="text-xs tracking-[0.16em] text-[var(--pms-muted)] uppercase">{type.code}</p>
                </div>
                <StatusBadge label={type.active ? "Attiva" : "Disattivata"} tone={type.active ? "green" : "stone"} />
              </div>
              <p className="mt-4 text-sm text-[var(--pms-muted)]">
                {type.roomCount} {type.roomCount === 1 ? "camera" : "camere"} · {type.capacity} ospiti
              </p>
              <p className="mt-1 text-sm">{formatMoney(type.basePrice)} / notte</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href={`/pms/rooms/types/${type.id}`} className="inline-flex">
                  <Button variant="outline" size="sm">
                    Apri
                  </Button>
                </Link>
                {canWrite ? (
                  <>
                    <Button variant="outline" size="sm" onClick={() => setEditing(type)}>
                      Modifica
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        const result = await duplicateRoomTypeAction(type.id);
                        if (!result.ok) toast.error(result.error);
                        else toast.success("Tipologia duplicata come inattiva.");
                      }}
                    >
                      Duplica
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        const result = await setRoomTypeActiveAction(type.id, !type.active);
                        if (!result.ok) toast.error(result.error);
                        else toast.success(type.active ? "Tipologia disattivata." : "Tipologia attivata.");
                      }}
                    >
                      {type.active ? "Disattiva" : "Attiva"}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setPendingDelete(type)}>
                      Elimina
                    </Button>
                  </>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}

      <Dialog
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        title={editing && editing !== "new" ? `Modifica ${editing.name}` : "Nuova tipologia"}
        className="w-[min(720px,calc(100vw-1.5rem))]"
      >
        {editing ? (
          <RoomTypeForm type={editing === "new" ? undefined : editing} onDone={() => setEditing(null)} />
        ) : null}
      </Dialog>

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Eliminare la tipologia?"
        description={
          pendingDelete
            ? `«${pendingDelete.name}» verrà eliminata solo se non ha camere o prenotazioni collegate. In caso contrario usa la disattivazione.`
            : ""
        }
        confirmLabel="Elimina"
        danger
        onConfirm={() => {
          if (!pendingDelete) return;
          void deleteRoomTypeAction(pendingDelete.id).then((result) => {
            if (!result.ok) toast.error(result.error);
            else toast.success("Tipologia eliminata.");
          });
        }}
      />
    </div>
  );
}
