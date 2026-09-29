"use client";

import type { RoomStatus } from "@prisma/client";
import { BedDouble, CalendarDays, Mail, Phone, Users } from "lucide-react";
import Link from "next/link";

import { LifecycleActions, type DeskPermissions, type StayPatch } from "@pms-core/components/reservations/lifecycle-actions";
import { reservationStatusMeta } from "@pms-core/config/status";
import { PAY_AT_PROPERTY_NOTE } from "@pms-core/lib/pay-at-property";
import { StatusBadge } from "@pms-core/components/ui/badge";
import { formatLong, nightsBetween } from "@pms-core/lib/dates";
import { formatMoney } from "@pms-core/lib/money";
import type { PlanningReservation } from "@pms-core/types";

export function ReservationDrawer({
  reservation,
  roomStatus,
  extras,
  permissions,
  businessToday,
  onClose,
  onMove,
  onChanged,
}: {
  reservation: PlanningReservation | null;
  roomStatus: RoomStatus;
  extras: { id: string; name: string; price: number }[];
  permissions: DeskPermissions;
  businessToday: string;
  onClose: () => void;
  onMove: () => void;
  onChanged: (patch?: StayPatch) => void;
}) {
  if (!reservation) {
    return (
      <aside className="pms-card hidden w-full p-5 lg:block">
        <p className="text-sm text-[var(--pms-muted)]">Seleziona una prenotazione per vederne i dettagli.</p>
      </aside>
    );
  }

  const meta = reservationStatusMeta[reservation.status];
  const nights = nightsBetween(reservation.checkIn, reservation.checkOut);

  return (
    <aside className="pms-card w-full p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-[var(--pms-muted)]">#{reservation.code}</p>
          <h2 className="pms-title mt-1 text-xl">{reservation.guestName}</h2>
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatusBadge label={meta.label} tone={meta.tone} />
          {reservation.status === "OPTION" && reservation.payAtProperty ? (
            <StatusBadge label={PAY_AT_PROPERTY_NOTE} tone="amber" />
          ) : null}
        </div>
      </div>

      <dl className="mt-5 space-y-3 text-sm">
        <div className="flex items-center gap-3 text-[var(--pms-muted)]">
          <Mail className="size-4" /> {reservation.email ?? "—"}
        </div>
        <div className="flex items-center gap-3 text-[var(--pms-muted)]">
          <Phone className="size-4" /> {reservation.phone ?? "—"}
        </div>
        <div className="flex items-start gap-3">
          <CalendarDays className="mt-0.5 size-4 shrink-0 text-[var(--pms-muted)]" />
          <p className="min-w-0">
            {formatLong(reservation.checkIn)}
            {" \u2013 "}
            {formatLong(reservation.checkOut)}
            <span className="whitespace-nowrap text-[var(--pms-muted)]">
              {" \u00b7 "}
              {nights} {nights === 1 ? "notte" : "notti"}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <BedDouble className="size-4 text-[var(--pms-muted)]" />
          Camera {reservation.roomNumber} · {reservation.roomTypeName}
        </div>
        <div className="flex items-center gap-3">
          <Users className="size-4 text-[var(--pms-muted)]" />
          {reservation.adults} adulti{reservation.children ? ` · ${reservation.children} bambini` : ""}
        </div>
      </dl>

      <div className="mt-5 rounded-2xl bg-white/70 px-4 py-3">
        <p className="text-xs text-[var(--pms-muted)]">Totale</p>
        <p className="font-semibold tabular-nums tracking-[-0.02em] text-2xl">{formatMoney(reservation.total, reservation.currency)}</p>
      </div>

      {reservation.notes ? <p className="mt-4 whitespace-pre-wrap text-sm text-[var(--pms-muted)]">{reservation.notes}</p> : null}

      <div className="mt-5">
        <LifecycleActions
          reservation={{
            id: reservation.id,
            code: reservation.code,
            status: reservation.status,
            total: reservation.total,
            roomNumber: reservation.roomNumber,
            roomStatus,
            checkIn: reservation.checkIn,
            checkOut: reservation.checkOut,
            balance: reservation.total,
          }}
          extras={extras}
          permissions={permissions}
          businessToday={businessToday}
          payAtProperty={reservation.payAtProperty}
          onModify={onMove}
          onChanged={onChanged}
        />
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-[var(--pms-muted)]">
        <Link href={`/pms/reservations/${reservation.id}`} className="underline-offset-2 hover:underline">
          Apri scheda
        </Link>
        <button type="button" onClick={onClose}>
          Chiudi
        </button>
      </div>
    </aside>
  );
}
