"use client";

import { BedDouble, CalendarDays, Mail, Phone, Users } from "lucide-react";
import { useState } from "react";

import { addReservationExtraAction, addReservationPaymentAction, updateReservationStatusAction } from "@pms-core/actions/reservations";
import { reservationStatusMeta } from "@pms-core/config/status";
import { Button } from "@pms-core/components/ui/button";
import { StatusBadge } from "@pms-core/components/ui/badge";
import { ConfirmDialog } from "@pms-core/components/ui/dialog";
import { formatLong, nightsBetween } from "@pms-core/lib/dates";
import { formatMoney } from "@pms-core/lib/money";
import type { PlanningReservation } from "@pms-core/types";

export function ReservationDrawer({
  reservation,
  extras,
  onClose,
  onMove,
  onChanged,
}: {
  reservation: PlanningReservation | null;
  extras: { id: string; name: string }[];
  onClose: () => void;
  onMove: () => void;
  onChanged: () => void;
}) {
  const [confirm, setConfirm] = useState<"CHECKED_IN" | "CHECKED_OUT" | "CANCELLED" | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!reservation) {
    return (
      <aside className="pms-card hidden w-full p-5 lg:block">
        <p className="text-sm text-[var(--pms-muted)]">Seleziona una prenotazione per vederne i dettagli.</p>
      </aside>
    );
  }

  const meta = reservationStatusMeta[reservation.status];

  async function run(status: "CHECKED_IN" | "CHECKED_OUT" | "CANCELLED") {
    const result = await updateReservationStatusAction(reservation!.id, status);
    if (!result.ok) setError(result.error);
    else onChanged();
  }

  return (
    <aside className="pms-card w-full p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-[var(--pms-muted)]">#{reservation.code}</p>
          <h2 className="mt-1 font-[family-name:var(--font-sora)] text-xl">{reservation.guestName}</h2>
        </div>
        <StatusBadge label={meta.label} tone={meta.tone} />
      </div>

      <dl className="mt-5 space-y-3 text-sm">
        <div className="flex items-center gap-3 text-[var(--pms-muted)]">
          <Mail className="size-4" /> {reservation.email ?? "—"}
        </div>
        <div className="flex items-center gap-3 text-[var(--pms-muted)]">
          <Phone className="size-4" /> {reservation.phone ?? "—"}
        </div>
        <div className="flex items-center gap-3">
          <CalendarDays className="size-4 text-[var(--pms-muted)]" />
          {formatLong(reservation.checkIn)} – {formatLong(reservation.checkOut)}
          <span className="text-[var(--pms-muted)]">· {nightsBetween(reservation.checkIn, reservation.checkOut)} notti</span>
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
        <p className="font-[family-name:var(--font-sora)] text-2xl">{formatMoney(reservation.total, reservation.currency)}</p>
      </div>

      {reservation.notes ? <p className="mt-4 text-sm text-[var(--pms-muted)]">{reservation.notes}</p> : null}
      {error ? <p className="mt-3 text-sm text-[#8a3b3b]">{error}</p> : null}

      <div className="mt-5 grid gap-2">
        <Button onClick={onMove}>Modifica / sposta</Button>
        <Button variant="outline" onClick={() => setConfirm("CHECKED_IN")}>
          Check-in
        </Button>
        <Button variant="outline" onClick={() => setConfirm("CHECKED_OUT")}>
          Check-out
        </Button>
        <Button
          variant="outline"
          onClick={async () => {
            const extra = extras[0];
            if (!extra) return;
            const result = await addReservationExtraAction(reservation.id, extra.id, 1);
            if (!result.ok) setError(result.error);
            else onChanged();
          }}
        >
          Aggiungi extra
        </Button>
        <Button
          variant="outline"
          onClick={async () => {
            const result = await addReservationPaymentAction({
              id: reservation.id,
              amount: Math.round(reservation.total * 0.3),
              method: "CARD",
            });
            if (!result.ok) setError(result.error);
            else onChanged();
          }}
        >
          Aggiungi pagamento
        </Button>
        <Button variant="ghost" onClick={() => setConfirm("CANCELLED")}>
          Cancella prenotazione
        </Button>
        <button type="button" className="text-xs text-[var(--pms-muted)]" onClick={onClose}>
          Chiudi
        </button>
      </div>

      <ConfirmDialog
        open={confirm !== null}
        onOpenChange={(open) => !open && setConfirm(null)}
        title={confirm === "CANCELLED" ? "Cancellare la prenotazione?" : "Confermare l'operazione?"}
        description={
          confirm === "CANCELLED"
            ? `La prenotazione ${reservation.code} verrà cancellata e la camera tornerà disponibile.`
            : `Aggiornare lo stato di ${reservation.code}?`
        }
        danger={confirm === "CANCELLED"}
        onConfirm={() => confirm && void run(confirm)}
      />
    </aside>
  );
}
