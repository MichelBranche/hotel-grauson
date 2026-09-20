"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import {
  changeRoomFloorAction,
  changeRoomTypeAction,
  setRoomActiveAction,
  updateRoomStatusAction,
} from "@pms-core/actions/rooms";
import { RoomForm } from "@pms-core/components/rooms/room-form";
import type { StructureFloor, StructureRoom, StructureType } from "@pms-core/components/rooms/types";
import { roomStatusMeta } from "@pms-core/config/status";
import { roomStatuses } from "@pms-core/lib/structure";
import { Button } from "@pms-core/components/ui/button";
import { Dialog } from "@pms-core/components/ui/dialog";
import { Field, Select } from "@pms-core/components/ui/input";

export function RoomDetailActions({
  room,
  types,
  floors,
  canWrite,
}: {
  room: StructureRoom;
  types: StructureType[];
  floors: StructureFloor[];
  canWrite: boolean;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [typeId, setTypeId] = useState(room.roomTypeId);
  const [floorId, setFloorId] = useState(room.floorId ?? "");
  const [status, setStatus] = useState(room.status);

  if (!canWrite) {
    return (
      <div className="flex flex-wrap gap-2">
        <Link href="/pms/planning">
          <Button variant="outline">Apri planning</Button>
        </Link>
        <Link href={`/pms/reservations?room=${room.number}`}>
          <Button variant="outline">Prenotazioni</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setEditOpen(true)}>Modifica camera</Button>
        <Button
          variant="outline"
          onClick={async () => {
            const result = await setRoomActiveAction(room.id, !room.active);
            if (!result.ok) toast.error(result.error);
            else toast.success(room.active ? "Camera disattivata." : "Camera attivata.");
          }}
        >
          {room.active ? "Disattiva" : "Attiva"}
        </Button>
        <Link href="/pms/planning">
          <Button variant="outline">Apri planning</Button>
        </Link>
        <Link href={`/pms/reservations?room=${room.number}`}>
          <Button variant="outline">Prenotazioni</Button>
        </Link>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Field label="Cambia tipologia">
          <div className="flex gap-2">
            <Select value={typeId} onChange={(event) => setTypeId(event.target.value)}>
              {types.filter((type) => type.active || type.id === room.roomTypeId).map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </Select>
            <Button
              variant="outline"
              onClick={async () => {
                const result = await changeRoomTypeAction(room.id, typeId);
                if (!result.ok) toast.error(result.error);
                else toast.success("Tipologia aggiornata. Le prenotazioni esistenti restano invariate.");
              }}
            >
              Applica
            </Button>
          </div>
        </Field>
        <Field label="Cambia piano">
          <div className="flex gap-2">
            <Select value={floorId} onChange={(event) => setFloorId(event.target.value)}>
              <option value="">Nessun piano</option>
              {floors.filter((floor) => floor.active || floor.id === room.floorId).map((floor) => (
                <option key={floor.id} value={floor.id}>
                  {floor.displayName}
                </option>
              ))}
            </Select>
            <Button
              variant="outline"
              onClick={async () => {
                const result = await changeRoomFloorAction(room.id, floorId || null);
                if (!result.ok) toast.error(result.error);
                else toast.success("Piano aggiornato.");
              }}
            >
              Applica
            </Button>
          </div>
        </Field>
        <Field label="Stato operativo">
          <div className="flex gap-2">
            <Select value={status} onChange={(event) => setStatus(event.target.value as typeof status)}>
              {roomStatuses.map((item) => (
                <option key={item} value={item}>
                  {roomStatusMeta[item].label}
                </option>
              ))}
            </Select>
            <Button
              variant="outline"
              onClick={async () => {
                const result = await updateRoomStatusAction(room.id, status);
                if (!result.ok) toast.error(result.error);
                else toast.success("Stato aggiornato.");
              }}
            >
              Applica
            </Button>
          </div>
        </Field>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen} title={`Modifica camera ${room.number}`}>
        <RoomForm room={room} types={types} floors={floors} onDone={() => setEditOpen(false)} />
      </Dialog>
    </div>
  );
}
