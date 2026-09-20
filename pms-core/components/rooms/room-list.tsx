"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { deleteRoomAction, setRoomActiveAction } from "@pms-core/actions/rooms";
import { RoomForm } from "@pms-core/components/rooms/room-form";
import type { StructureFloor, StructurePermissions, StructureRoom, StructureType } from "@pms-core/components/rooms/types";
import { roomStatusMeta } from "@pms-core/config/status";
import { Button } from "@pms-core/components/ui/button";
import { ConfirmDialog, Dialog } from "@pms-core/components/ui/dialog";
import { EmptyState } from "@pms-core/components/ui/empty-state";
import { Input, Select } from "@pms-core/components/ui/input";
import { StatusBadge } from "@pms-core/components/ui/badge";
import { formatMoney } from "@pms-core/lib/money";
import type { RoomStatus } from "@prisma/client";

export function RoomList({
  rooms,
  types,
  floors,
  canWrite,
}: {
  rooms: StructureRoom[];
  types: StructureType[];
  floors: StructureFloor[];
  canWrite: StructurePermissions["rooms"];
}) {
  const [query, setQuery] = useState("");
  const [floorId, setFloorId] = useState("all");
  const [roomTypeId, setRoomTypeId] = useState("all");
  const [status, setStatus] = useState("all");
  const [active, setActive] = useState("all");
  const [editing, setEditing] = useState<StructureRoom | null | "new">(null);
  const [pendingDelete, setPendingDelete] = useState<StructureRoom | null>(null);

  const filtered = useMemo(
    () =>
      rooms.filter((room) => {
        const hay = `${room.number} ${room.name ?? ""}`.toLowerCase();
        if (query && !hay.includes(query.toLowerCase())) return false;
        if (floorId !== "all" && room.floorId !== floorId) return false;
        if (roomTypeId !== "all" && room.roomTypeId !== roomTypeId) return false;
        if (status !== "all" && room.status !== status) return false;
        if (active === "active" && !room.active) return false;
        if (active === "inactive" && room.active) return false;
        return true;
      }),
    [rooms, query, floorId, roomTypeId, status, active],
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <label className="block xl:col-span-2">
          <span className="mb-1.5 block text-xs text-[var(--pms-muted)]">Cerca numero o nome</span>
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="101, Suite nord…" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs text-[var(--pms-muted)]">Piano</span>
          <Select value={floorId} onChange={(event) => setFloorId(event.target.value)}>
            <option value="all">Tutti</option>
            {floors.map((floor) => (
              <option key={floor.id} value={floor.id}>
                {floor.displayName}
              </option>
            ))}
          </Select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs text-[var(--pms-muted)]">Tipologia</span>
          <Select value={roomTypeId} onChange={(event) => setRoomTypeId(event.target.value)}>
            <option value="all">Tutte</option>
            {types.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </Select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs text-[var(--pms-muted)]">Stato</span>
          <Select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="all">Tutti</option>
            {Object.entries(roomStatusMeta).map(([key, meta]) => (
              <option key={key} value={key}>
                {meta.label}
              </option>
            ))}
          </Select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs text-[var(--pms-muted)]">Attiva</span>
          <Select value={active} onChange={(event) => setActive(event.target.value)}>
            <option value="all">Tutte</option>
            <option value="active">Attive</option>
            <option value="inactive">Disattivate</option>
          </Select>
        </label>
      </div>
      {canWrite ? (
        <div className="flex justify-end">
          <Button onClick={() => setEditing("new")}>Nuova camera</Button>
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <EmptyState title="Nessuna camera" body="Nessuna camera corrisponde ai filtri selezionati." />
      ) : (
        <>
          <div className="hidden overflow-hidden pms-card md:block">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-[var(--pms-muted)]">
                <tr>
                  <th className="px-4 py-3">Camera</th>
                  <th className="px-4 py-3">Tipologia</th>
                  <th className="px-4 py-3">Piano</th>
                  <th className="px-4 py-3">Stato</th>
                  <th className="px-4 py-3">Capienza</th>
                  <th className="px-4 py-3">Prezzo</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((room) => (
                  <tr key={room.id} className="border-t border-[var(--pms-line)]">
                    <td className="px-4 py-3">
                      <Link href={`/pms/rooms/${room.id}`} className="font-medium">
                        {room.number}
                      </Link>
                      <span className="ml-2 text-xs text-[var(--pms-muted)]">{room.active ? "" : "inattiva"}</span>
                    </td>
                    <td className="px-4 py-3">{room.roomTypeName}</td>
                    <td className="px-4 py-3">{room.floorName ?? "—"}</td>
                    <td className="px-4 py-3">
                      <StatusBadge label={roomStatusMeta[room.status].label} tone={roomStatusMeta[room.status].tone} />
                    </td>
                    <td className="px-4 py-3">{room.capacity}</td>
                    <td className="px-4 py-3">{formatMoney(room.displayPrice)}</td>
                    <td className="px-4 py-3 text-right">
                      {canWrite ? (
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => setEditing(room)}>
                            Modifica
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              const result = await setRoomActiveAction(room.id, !room.active);
                              if (!result.ok) toast.error(result.error);
                              else toast.success(room.active ? "Camera disattivata." : "Camera attivata.");
                            }}
                          >
                            {room.active ? "Disattiva" : "Attiva"}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setPendingDelete(room)}>
                            Elimina
                          </Button>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 md:hidden">
            {filtered.map((room) => (
              <article key={room.id} className="pms-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <Link href={`/pms/rooms/${room.id}`} className="pms-title text-xl">
                    {room.number}
                  </Link>
                  <StatusBadge label={roomStatusMeta[room.status as RoomStatus].label} tone={roomStatusMeta[room.status].tone} />
                </div>
                <p className="mt-2 text-sm text-[var(--pms-muted)]">
                  {room.roomTypeName} · {room.floorName ?? "senza piano"} · {room.capacity} ospiti
                </p>
                <p className="mt-1 text-sm">{formatMoney(room.displayPrice)}</p>
                {canWrite ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => setEditing(room)}>
                      Modifica
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setPendingDelete(room)}>
                      Elimina
                    </Button>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </>
      )}

      <Dialog
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        title={editing && editing !== "new" ? `Modifica camera ${editing.number}` : "Nuova camera"}
      >
        {editing ? (
          <RoomForm
            room={editing === "new" ? undefined : editing}
            types={types}
            floors={floors}
            onDone={() => setEditing(null)}
          />
        ) : null}
      </Dialog>

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Eliminare la camera?"
        description={
          pendingDelete
            ? `La camera ${pendingDelete.number} può essere eliminata solo se non ha prenotazioni. Altrimenti verrà chiesto di disattivarla.`
            : ""
        }
        confirmLabel="Elimina"
        danger
        onConfirm={() => {
          if (!pendingDelete) return;
          void deleteRoomAction(pendingDelete.id).then((result) => {
            if (!result.ok) toast.error(result.error);
            else toast.success("Camera eliminata.");
          });
        }}
      />
    </div>
  );
}
