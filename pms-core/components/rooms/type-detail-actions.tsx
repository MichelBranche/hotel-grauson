"use client";

import { useState } from "react";
import { toast } from "sonner";

import { deleteRoomTypeAction, duplicateRoomTypeAction, setRoomTypeActiveAction } from "@pms-core/actions/rooms";
import { RoomTypeForm } from "@pms-core/components/rooms/type-form";
import type { StructureType } from "@pms-core/components/rooms/types";
import { Button } from "@pms-core/components/ui/button";
import { ConfirmDialog, Dialog } from "@pms-core/components/ui/dialog";

export function TypeDetailActions({ type }: { type: StructureType }) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <section className="pms-card p-6">
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setEditOpen(true)}>Modifica</Button>
        <Button
          variant="outline"
          onClick={async () => {
            const result = await duplicateRoomTypeAction(type.id);
            if (!result.ok) toast.error(result.error);
            else toast.success("Tipologia duplicata come inattiva.");
          }}
        >
          Duplica
        </Button>
        <Button
          variant="outline"
          onClick={async () => {
            const result = await setRoomTypeActiveAction(type.id, !type.active);
            if (!result.ok) toast.error(result.error);
            else toast.success(type.active ? "Tipologia disattivata." : "Tipologia attivata.");
          }}
        >
          {type.active ? "Disattiva" : "Attiva"}
        </Button>
        <Button variant="ghost" onClick={() => setDeleteOpen(true)}>
          Elimina
        </Button>
      </div>
      <Dialog
        open={editOpen}
        onOpenChange={setEditOpen}
        title={`Modifica ${type.name}`}
        description="Le modifiche valgono per le nuove prenotazioni. Lo storico resta invariato."
        flush
        className="w-[min(680px,calc(100vw-1.5rem))]"
      >
        <RoomTypeForm type={type} onDone={() => setEditOpen(false)} />
      </Dialog>
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Eliminare la tipologia?"
        description="L'eliminazione è bloccata se ci sono camere o prenotazioni collegate. In quel caso usa la disattivazione."
        confirmLabel="Elimina"
        danger
        onConfirm={() => {
          void deleteRoomTypeAction(type.id).then((result) => {
            if (!result.ok) toast.error(result.error);
            else toast.success("Tipologia eliminata.");
          });
        }}
      />
    </section>
  );
}
