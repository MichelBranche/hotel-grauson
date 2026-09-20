"use client";

import { useState } from "react";
import { toast } from "sonner";

import { deleteFloorAction, setFloorActiveAction } from "@pms-core/actions/rooms";
import { FloorForm } from "@pms-core/components/rooms/floor-form";
import type { StructureFloor } from "@pms-core/components/rooms/types";
import { Button } from "@pms-core/components/ui/button";
import { ConfirmDialog, Dialog } from "@pms-core/components/ui/dialog";
import { EmptyState } from "@pms-core/components/ui/empty-state";
import { StatusBadge } from "@pms-core/components/ui/badge";

export function FloorList({ floors, canWrite }: { floors: StructureFloor[]; canWrite: boolean }) {
  const [editing, setEditing] = useState<StructureFloor | null | "new">(null);
  const [pendingDelete, setPendingDelete] = useState<StructureFloor | null>(null);

  return (
    <div className="space-y-4">
      {canWrite ? (
        <div className="flex justify-end">
          <Button onClick={() => setEditing("new")}>Nuovo piano</Button>
        </div>
      ) : null}

      {floors.length === 0 ? (
        <EmptyState title="Nessun piano" body="Aggiungi i piani della struttura per assegnare le camere." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {floors.map((floor) => (
            <article key={floor.id} className="pms-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="pms-title text-lg">{floor.displayName}</p>
                  <p className="text-xs text-[var(--pms-muted)]">
                    {floor.name} · ordine {floor.sortOrder}
                  </p>
                </div>
                <StatusBadge label={floor.active ? "Attivo" : "Disattivato"} tone={floor.active ? "green" : "stone"} />
              </div>
              {floor.description ? <p className="mt-3 text-sm text-[var(--pms-muted)]">{floor.description}</p> : null}
              <p className="mt-4 text-sm">
                {floor.roomCount} {floor.roomCount === 1 ? "camera" : "camere"}
              </p>
              {canWrite ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditing(floor)}>
                    Modifica
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      const result = await setFloorActiveAction(floor.id, !floor.active);
                      if (!result.ok) toast.error(result.error);
                      else toast.success(floor.active ? "Piano disattivato." : "Piano attivato.");
                    }}
                  >
                    {floor.active ? "Disattiva" : "Attiva"}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setPendingDelete(floor)}>
                    Elimina
                  </Button>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}

      <Dialog
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        title={editing && editing !== "new" ? `Modifica ${editing.displayName}` : "Nuovo piano"}
      >
        {editing ? (
          <FloorForm
            floor={editing === "new" ? undefined : editing}
            nextOrder={floors.length}
            onDone={() => setEditing(null)}
          />
        ) : null}
      </Dialog>

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Eliminare il piano?"
        description={
          pendingDelete
            ? `«${pendingDelete.displayName}» può essere eliminato solo se non ha camere assegnate.`
            : ""
        }
        confirmLabel="Elimina"
        danger
        onConfirm={() => {
          if (!pendingDelete) return;
          void deleteFloorAction(pendingDelete.id).then((result) => {
            if (!result.ok) toast.error(result.error);
            else toast.success("Piano eliminato.");
          });
        }}
      />
    </div>
  );
}
