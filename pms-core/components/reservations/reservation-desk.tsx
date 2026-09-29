"use client";

import type { ReservationStatus, RoomStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { updateReservationNotesAction } from "@pms-core/actions/reservations";
import { MoveDialog } from "@pms-core/components/planning/move-dialog";
import { LifecycleActions, type DeskPermissions } from "@pms-core/components/reservations/lifecycle-actions";
import { Button } from "@pms-core/components/ui/button";
import { Textarea } from "@pms-core/components/ui/input";
import { formatMoneyExact } from "@pms-core/lib/money";
import type { PlanningReservation, PlanningRoom } from "@pms-core/types";

export function ReservationDesk({
  reservation,
  stay,
  rooms,
  plans,
  extras,
  permissions,
  businessToday,
  balance,
}: {
  reservation: PlanningReservation;
  stay: {
    status: ReservationStatus;
    roomStatus: RoomStatus;
    roomRate: number;
    extrasTotal: number;
    taxesTotal: number;
    paid: number;
  };
  rooms: PlanningRoom[];
  plans: { id: string; code: string; name: string }[];
  extras: { id: string; name: string; price: number }[];
  permissions: DeskPermissions;
  businessToday: string;
  balance: number;
}) {
  const router = useRouter();
  const [moveOpen, setMoveOpen] = useState(false);
  const [notes, setNotes] = useState(reservation.notes);
  const [notesSource, setNotesSource] = useState(reservation.notes);
  if (reservation.notes !== notesSource) {
    setNotesSource(reservation.notes);
    setNotes(reservation.notes);
  }
  const [savingNotes, setSavingNotes] = useState(false);

  function refresh() {
    router.refresh();
  }

  return (
    <section className="pms-card space-y-5 p-5 text-sm">
      <p>
        {reservation.checkIn} → {reservation.checkOut} · {reservation.nights} notti
      </p>
      <p>
        Camera {reservation.roomNumber} · {reservation.roomTypeName}
      </p>
      <p>
        {reservation.adults} adulti{reservation.children ? ` · ${reservation.children} bambini` : ""}
      </p>
      <p>Email: {reservation.email ?? "—"}</p>
      <p>Telefono: {reservation.phone ?? "—"}</p>
      <div className="rounded-2xl bg-white/70 px-4 py-3">
        <p>Camera {formatMoneyExact(stay.roomRate)}</p>
        <p>Extra {formatMoneyExact(stay.extrasTotal)}</p>
        <p>Tasse {formatMoneyExact(stay.taxesTotal)}</p>
        <p className="mt-1 font-semibold">Totale {formatMoneyExact(reservation.total)}</p>
        <p>Pagato {formatMoneyExact(stay.paid)} · saldo {formatMoneyExact(balance)}</p>
      </div>
      <LifecycleActions
        reservation={{
          id: reservation.id,
          code: reservation.code,
          status: stay.status,
          total: reservation.total,
          roomNumber: reservation.roomNumber,
          roomStatus: stay.roomStatus,
          checkIn: reservation.checkIn,
          checkOut: reservation.checkOut,
          balance,
        }}
        extras={extras}
        permissions={permissions}
        businessToday={businessToday}
        onModify={permissions.canModify ? () => setMoveOpen(true) : undefined}
        onChanged={refresh}
      />
      <form
        className="grid gap-2"
        onSubmit={async (event) => {
          event.preventDefault();
          setSavingNotes(true);
          const result = await updateReservationNotesAction(reservation.id, notes);
          setSavingNotes(false);
          if (!result.ok) toast.error(result.error);
          else {
            toast.success("Note aggiornate.");
            refresh();
          }
        }}
      >
        <label className="text-xs text-[var(--pms-muted)]" htmlFor="reservation-notes">
          Note
        </label>
        <Textarea id="reservation-notes" value={notes} onChange={(event) => setNotes(event.target.value)} disabled={!permissions.canWrite} />
        {permissions.canWrite ? (
          <Button type="submit" variant="outline" disabled={savingNotes || notes === reservation.notes}>
            {savingNotes ? "Salvataggio…" : "Salva note"}
          </Button>
        ) : null}
      </form>
      <MoveDialog
        open={moveOpen}
        onOpenChange={setMoveOpen}
        reservation={reservation}
        rooms={rooms}
        plans={plans}
        onSaved={(next) => {
          const priceNote =
            next.previousTotal === next.total
              ? ""
              : ` Totale ${formatMoneyExact(next.previousTotal)} → ${formatMoneyExact(next.total)}.`;
          toast.success(`Prenotazione aggiornata.${priceNote}`);
          refresh();
        }}
      />
    </section>
  );
}
