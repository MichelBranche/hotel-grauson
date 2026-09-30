"use client";

import type { ReservationStatus, RoomStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { updateReservationNotesAction } from "@pms-core/actions/reservations";
import { MoveDialog } from "@pms-core/components/planning/move-dialog";
import { LifecycleActions, type DeskPermissions, type StayPatch } from "@pms-core/components/reservations/lifecycle-actions";
import { MaskedDocument } from "@pms-core/components/reservations/masked-document";
import { reportAction } from "@pms-core/components/ui/action-feedback";
import { StatusBadge } from "@pms-core/components/ui/badge";
import { Button } from "@pms-core/components/ui/button";
import { Textarea } from "@pms-core/components/ui/input";
import { reservationStatusMeta } from "@pms-core/config/status";
import { PAY_AT_PROPERTY_NOTE } from "@pms-core/lib/pay-at-property";
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
  expiresLabel = null,
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
  expiresLabel?: string | null;
}) {
  const router = useRouter();
  const [moveOpen, setMoveOpen] = useState(false);
  const [notes, setNotes] = useState(reservation.notes);
  const [live, setLive] = useState({
    status: stay.status,
    roomStatus: stay.roomStatus,
    total: reservation.total,
    checkOut: reservation.checkOut,
    nights: reservation.nights,
    roomNumber: reservation.roomNumber,
    roomTypeName: reservation.roomTypeName,
    roomRate: stay.roomRate,
    extrasTotal: stay.extrasTotal,
    taxesTotal: stay.taxesTotal,
    paid: stay.paid,
    guestName: reservation.guestName,
    guestFirstName: reservation.guestFirstName,
    guestLastName: reservation.guestLastName,
    email: reservation.email,
    phone: reservation.phone,
    country: reservation.country,
    party: reservation.party,
    balance,
  });
  const signature = [
    stay.status,
    stay.roomStatus,
    reservation.total,
    reservation.checkOut,
    reservation.nights,
    reservation.roomNumber,
    reservation.roomTypeName,
    stay.roomRate,
    stay.extrasTotal,
    stay.taxesTotal,
    stay.paid,
    reservation.guestName,
    reservation.guestFirstName,
    reservation.guestLastName,
    reservation.email ?? "",
    reservation.phone ?? "",
    reservation.country ?? "",
    reservation.party.map((guest) => `${guest.id}:${guest.documentLast4 ?? ""}`).join(","),
    balance,
    reservation.notes,
  ].join("|");
  const [seen, setSeen] = useState(signature);
  if (signature !== seen) {
    setSeen(signature);
    setNotes(reservation.notes);
    setLive({
      status: stay.status,
      roomStatus: stay.roomStatus,
      total: reservation.total,
      checkOut: reservation.checkOut,
      nights: reservation.nights,
      roomNumber: reservation.roomNumber,
      roomTypeName: reservation.roomTypeName,
      roomRate: stay.roomRate,
      extrasTotal: stay.extrasTotal,
      taxesTotal: stay.taxesTotal,
      paid: stay.paid,
      guestName: reservation.guestName,
      guestFirstName: reservation.guestFirstName,
      guestLastName: reservation.guestLastName,
      email: reservation.email,
      phone: reservation.phone,
      country: reservation.country,
      party: reservation.party,
      balance,
    });
  }
  const [savingNotes, setSavingNotes] = useState(false);

  function refresh(patch?: StayPatch) {
    if (patch) {
      setLive((current) => ({
        ...current,
        status: patch.status,
        roomStatus: patch.roomStatus,
        total: patch.total,
        checkOut: patch.checkOut,
        nights: patch.nights,
        balance: Math.max(0, patch.total - current.paid),
        ...(patch.guestName !== undefined
          ? {
              guestName: patch.guestName,
              guestFirstName: patch.guestFirstName ?? current.guestFirstName,
              guestLastName: patch.guestLastName ?? current.guestLastName,
              email: patch.email ?? null,
              phone: patch.phone ?? null,
              country: patch.country ?? null,
              party: patch.party ?? current.party,
            }
          : {}),
      }));
      return;
    }
    router.refresh();
  }

  const meta = reservationStatusMeta[live.status];

  return (
    <section className="pms-card space-y-5 p-5 text-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs text-[var(--pms-muted)]">{reservation.code}</p>
          <h1 className="text-3xl">{live.guestName}</h1>
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatusBadge label={meta.label} tone={meta.tone} />
          {live.status === "OPTION" && reservation.payAtProperty ? (
            <StatusBadge label={PAY_AT_PROPERTY_NOTE} tone="amber" />
          ) : null}
        </div>
      </div>
      <p>
        {reservation.checkIn} → {live.checkOut} · {live.nights} notti
      </p>
      {live.status === "OPTION" && expiresLabel ? <p className="text-[var(--pms-muted)]">{expiresLabel}</p> : null}
      <p>
        Camera {live.roomNumber} · {live.roomTypeName}
      </p>
      <p>
        {reservation.adults} adulti{reservation.children ? ` · ${reservation.children} bambini` : ""}
      </p>
      <p>Email: {live.email ?? "—"}</p>
      <p>Telefono: {live.phone ?? "—"}</p>
      <p>Paese: {live.country ?? "Non indicato"}</p>
      <ul className="grid gap-2">
        {live.party.map((guest) => (
          <li key={guest.id}>
            {guest.isPrimary ? null : (
              <span>
                {guest.lastName} {guest.firstName} · altro ospite ·{" "}
              </span>
            )}
            <MaskedDocument guestId={guest.id} documentType={guest.documentType} last4={guest.documentLast4} canReveal={permissions.canCheckIn} />
          </li>
        ))}
      </ul>
      <div className="rounded-2xl bg-white/70 px-4 py-3">
        <p>Camera {formatMoneyExact(live.roomRate)}</p>
        <p>Extra {formatMoneyExact(live.extrasTotal)}</p>
        <p>Tasse {formatMoneyExact(live.taxesTotal)}</p>
        <p className="mt-1 font-semibold">Totale {formatMoneyExact(live.total)}</p>
        <p>Pagato {formatMoneyExact(live.paid)} · saldo {formatMoneyExact(live.balance)}</p>
      </div>
      <LifecycleActions
        reservation={{
          id: reservation.id,
          code: reservation.code,
          status: live.status,
          total: live.total,
          roomNumber: live.roomNumber,
          roomStatus: live.roomStatus,
          checkIn: reservation.checkIn,
          checkOut: live.checkOut,
          balance: live.balance,
        }}
        extras={extras}
        permissions={permissions}
        businessToday={businessToday}
        payAtProperty={reservation.payAtProperty}
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
          if (reportAction(`notes-${reservation.id}`, result, "Note aggiornate.")) refresh();
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
          toast.success(`Prenotazione aggiornata.${priceNote}`, { id: `move-${next.id}` });
          setLive((current) => ({
            ...current,
            total: next.total,
            checkOut: next.checkOut,
            nights: next.nights,
            roomNumber: next.roomNumber,
            roomTypeName: next.roomTypeName,
            roomRate: next.roomRate,
            extrasTotal: next.extrasTotal,
            taxesTotal: next.taxesTotal,
            guestName: next.guestName,
            guestFirstName: next.guestFirstName,
            guestLastName: next.guestLastName,
            email: next.email,
            phone: next.phone,
            balance: Math.max(0, next.total - current.paid),
          }));
          router.refresh();
        }}
      />
    </section>
  );
}
