"use client";

import { useState } from "react";

import { moveReservationAction } from "@pms-core/actions/reservations";
import { Button } from "@pms-core/components/ui/button";
import { Dialog } from "@pms-core/components/ui/dialog";
import { Field, Input } from "@pms-core/components/ui/input";
import type { PlanningReservation, PlanningRoom } from "@pms-core/types";

export function MoveDialog({
  open,
  onOpenChange,
  reservation,
  rooms,
  onMoved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reservation: PlanningReservation | null;
  rooms: PlanningRoom[];
  onMoved: (previous: { roomId: string; checkIn: string; checkOut: string }) => void;
}) {
  const [roomId, setRoomId] = useState(reservation?.roomId ?? "");
  const [checkIn, setCheckIn] = useState(reservation?.checkIn ?? "");
  const [checkOut, setCheckOut] = useState(reservation?.checkOut ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (!reservation) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Sposta prenotazione">
      <form
        className="grid gap-4"
        onSubmit={async (event) => {
          event.preventDefault();
          setPending(true);
          setError(null);
          const previous = { roomId: reservation.roomId, checkIn: reservation.checkIn, checkOut: reservation.checkOut };
          const result = await moveReservationAction({
            id: reservation.id,
            roomId: roomId || reservation.roomId,
            checkIn,
            checkOut,
          });
          setPending(false);
          if (!result.ok) {
            setError(result.error);
            return;
          }
          onMoved(previous);
          onOpenChange(false);
        }}
      >
        <Field label="Camera">
          <select
            className="h-10 w-full rounded-2xl border border-[var(--pms-line)] bg-white/70 px-3 text-sm"
            value={roomId || reservation.roomId}
            onChange={(event) => setRoomId(event.target.value)}
          >
            {rooms
              .filter((room) => room.active !== false || room.id === reservation.roomId)
              .map((room) => (
              <option key={room.id} value={room.id}>
                {room.number} · {room.roomTypeName}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Check-in">
            <Input type="date" value={checkIn || reservation.checkIn} onChange={(event) => setCheckIn(event.target.value)} />
          </Field>
          <Field label="Check-out">
            <Input type="date" value={checkOut || reservation.checkOut} onChange={(event) => setCheckOut(event.target.value)} />
          </Field>
        </div>
        {error ? <p className="text-sm text-[#8a3b3b]">{error}</p> : null}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Annulla
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Salvataggio…" : "Sposta"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
