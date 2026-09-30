"use client";

import type { ReservationStatus, RoomStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import {
  addReservationExtraAction,
  addReservationPaymentAction,
  cancelReservationAction,
  updateReservationStatusAction,
} from "@pms-core/actions/reservations";
import { CheckInDesk } from "@pms-core/components/reservations/check-in-desk";
import { reportAction } from "@pms-core/components/ui/action-feedback";
import { Button } from "@pms-core/components/ui/button";
import { ConfirmDialog, Dialog } from "@pms-core/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@pms-core/components/ui/input";
import type { StayGuestSummary } from "@pms-core/lib/check-in-guest";
import { formatShort, todayISO } from "@pms-core/lib/dates";
import { CONFIRM_NOTIFICATION_SOUND, playPmsSound } from "@pms-core/lib/pms-sound";
import { formatMoneyExact } from "@pms-core/lib/money";
import { guestDisplay } from "@pms-core/lib/utils";
import { actionsFor, checkInBlockMessage, earlyCheckout, primaryDeskAction, type DeskAction } from "@pms-core/lib/reservation-status";

const PAYMENT_METHODS = [
  ["CASH", "Contanti"],
  ["CARD", "Carta"],
  ["BANK_TRANSFER", "Bonifico"],
  ["ONLINE", "Online"],
  ["OTHER", "Altro"],
] as const;

export type StayPatch = {
  status: ReservationStatus;
  roomStatus: RoomStatus;
  total: number;
  checkOut: string;
  nights: number;
  guestName?: string;
  guestFirstName?: string;
  guestLastName?: string;
  email?: string | null;
  phone?: string | null;
  country?: string | null;
  party?: StayGuestSummary[];
};

export type DeskPermissions = {
  canWrite: boolean;
  canModify: boolean;
  canCancel: boolean;
  canCheckIn: boolean;
  canPay: boolean;
  canExtra: boolean;
  canForceCancel: boolean;
};

export function LifecycleActions({
  reservation,
  extras,
  permissions,
  businessToday,
  onModify,
  onChanged,
  payAtProperty = false,
  density = "full",
}: {
  reservation: {
    id: string;
    code: string;
    status: ReservationStatus;
    total: number;
    roomNumber: string;
    roomStatus: RoomStatus;
    checkIn: string;
    checkOut: string;
    balance: number;
  };
  extras: { id: string; name: string; price: number }[];
  permissions: DeskPermissions;
  businessToday: string;
  onModify?: () => void;
  onChanged: (patch?: StayPatch) => void;
  /** Website option that asked to pay at the property. Uses the same confirm and cancel actions. */
  payAtProperty?: boolean;
  /** Bar control: only Conferma, Check-in, or Check-out. */
  density?: "full" | "primary";
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<"check-in" | "check-out" | "no-show" | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [force, setForce] = useState(false);
  const [reason, setReason] = useState("");
  const [payOpen, setPayOpen] = useState(false);
  const [amount, setAmount] = useState(reservation.balance > 0 ? String(reservation.balance) : "");
  const [method, setMethod] = useState<(typeof PAYMENT_METHODS)[number][0]>("CARD");
  const [extraOpen, setExtraOpen] = useState(false);
  const [extraId, setExtraId] = useState(extras[0]?.id ?? "");
  const [quantity, setQuantity] = useState("1");
  const [checkInOpen, setCheckInOpen] = useState(false);

  const departure = earlyCheckout(reservation.checkIn, reservation.checkOut, businessToday || todayISO());
  const blocked = checkInBlockMessage({ number: reservation.roomNumber, status: reservation.roomStatus });
  const actions = actionsFor(reservation.status).filter((action) => allowed(action, permissions, Boolean(onModify)));
  const webRequest = payAtProperty && reservation.status === "OPTION";
  const primary = primaryDeskAction(reservation.status);
  const primaryAllowed = primary !== null && actions.includes(primary);

  async function finish(result: {
    ok: true;
    data: {
      message: string;
      housekeepingCreated: boolean;
      status: ReservationStatus;
      roomStatus: RoomStatus;
      total: number;
      checkOut: string;
      nights: number;
      guest?: { firstName: string; lastName: string; email: string | null; phone: string | null; country: string };
      party?: StayGuestSummary[];
    };
  } | { ok: false; error: string }) {
    setPending(false);
    if (!result.ok) {
      toast.error(result.error, { id: `reservation-${reservation.id}` });
      return false;
    }
    toast.success(result.data.message, {
      id: `reservation-${reservation.id}`,
      action: result.data.housekeepingCreated
        ? { label: "Housekeeping", onClick: () => router.push("/pms/housekeeping") }
        : undefined,
    });
    const saved = result.data.guest;
    onChanged({
      status: result.data.status,
      roomStatus: result.data.roomStatus,
      total: result.data.total,
      checkOut: result.data.checkOut,
      nights: result.data.nights,
      ...(saved
        ? {
            guestName: guestDisplay(saved.firstName, saved.lastName),
            guestFirstName: saved.firstName,
            guestLastName: saved.lastName,
            email: saved.email,
            phone: saved.phone,
            country: saved.country,
            party: result.data.party,
          }
        : {}),
    });
    if (webRequest && result.data.status === "CONFIRMED") playPmsSound(CONFIRM_NOTIFICATION_SOUND);
    return true;
  }

  async function runStatus(status: "CHECKED_IN" | "CHECKED_OUT" | "NO_SHOW" | "CONFIRMED" | "OPTION", key?: string) {
    setPending(true);
    setBusy(key ?? null);
    await finish(await updateReservationStatusAction(reservation.id, status));
    setBusy(null);
  }

  function beginCheckIn() {
    if (blocked) return;
    setCheckInOpen(true);
  }

  const checkInDesk = (
    <CheckInDesk
      open={checkInOpen}
      reservationId={reservation.id}
      onOpenChange={setCheckInOpen}
      onCompleted={async (result) => {
        const ok = await finish(result);
        if (ok) setCheckInOpen(false);
      }}
    />
  );

  if (density === "primary") {
    if (!primaryAllowed || !primary) return null;
    const blockedIn = primary === "check-in" && Boolean(blocked);
    return (
      <>
      <Button
        size="sm"
        className="h-7 px-2.5 text-[11px]"
        pending={busy === primary}
        pendingLabel="Attendi…"
        disabled={pending || blockedIn}
        title={blockedIn ? blocked ?? undefined : quickTitle(primary)}
        aria-label={`${label(primary, false)} ${reservation.code}`}
        onClick={() => {
          if (primary === "confirm") void runStatus("CONFIRMED", primary);
          else if (primary === "check-in") beginCheckIn();
          else void runStatus("CHECKED_OUT", primary);
        }}
      >
        {label(primary, false)}
      </Button>
      {checkInDesk}
      </>
    );
  }

  return (
    <div className="grid gap-2">
      {reservation.status === "CHECKED_OUT" || reservation.status === "CANCELLED" || reservation.status === "NO_SHOW" ? (
        <p className="text-sm text-[var(--pms-muted)]">Stato definitivo: si possono aggiornare solo le note.</p>
      ) : null}
      {blocked && actions.includes("check-in") ? <p className="text-sm text-[#8a3b3b]">{blocked}</p> : null}
      {webRequest ? (
        <p className="text-sm text-[var(--pms-muted)]">
          Conferma il soggiorno: il pagamento si fa in reception. Rifiuta: la camera torna libera.
        </p>
      ) : null}
      {actions.map((action) => (
        <Button
          key={action}
          variant={
            webRequest && action === "cancel"
              ? "danger"
              : action === "cancel" || action === "no-show"
                ? "ghost"
                : action === "check-in" || action === "check-out" || action === "confirm"
                  ? "default"
                  : "outline"
          }
          pending={busy === action}
          disabled={pending || (action === "check-in" && Boolean(blocked)) || (action === "extra" && extras.length === 0)}
          onClick={() => {
            if (action === "modify") onModify?.();
            else if (action === "confirm") void runStatus("CONFIRMED", action);
            else if (action === "option") void runStatus("OPTION", action);
            else if (action === "check-in") beginCheckIn();
            else if (action === "check-out") setConfirm("check-out");
            else if (action === "no-show") setConfirm("no-show");
            else if (action === "cancel") {
              setForce(false);
              setReason(webRequest ? "Richiesta web rifiutata" : "");
              setCancelOpen(true);
            } else if (action === "extra") setExtraOpen(true);
            else if (action === "payment") {
              setAmount(reservation.balance > 0 ? String(reservation.balance) : "");
              setPayOpen(true);
            }
          }}
        >
          {label(action, extras.length === 0, webRequest)}
        </Button>
      ))}
      {reservation.status === "CHECKED_IN" && permissions.canForceCancel ? (
        <Button
          variant="ghost"
          disabled={pending}
          onClick={() => {
            setForce(true);
            setReason("");
            setCancelOpen(true);
          }}
        >
          Annulla comunque
        </Button>
      ) : null}

      <ConfirmDialog
        open={confirm !== null}
        onOpenChange={(open) => !open && setConfirm(null)}
        title={confirm === "check-out" ? "Registrare il check-out?" : confirm === "no-show" ? "Segnare no-show?" : "Registrare il check-in?"}
        description={
          confirm === "check-out"
            ? departure.shortened
              ? `Check-out anticipato: la partenza diventa il ${formatShort(departure.checkOut)}. Il totale di ${formatMoneyExact(reservation.total)} non cambia e le notti restanti tornano in vendita. La camera ${reservation.roomNumber} sarà da pulire.`
              : `La camera ${reservation.roomNumber} passerà a da pulire e verrà creato un compito di housekeeping.`
            : confirm === "no-show"
              ? `${reservation.code} non è arrivato. La camera torna subito in vendita.`
              : `Check-in di ${reservation.code} in camera ${reservation.roomNumber}.`
        }
        confirmLabel={confirm === "no-show" ? "Segna no-show" : "Conferma"}
        danger={confirm === "no-show"}
        onConfirm={() => {
          if (confirm === "check-out") return runStatus("CHECKED_OUT");
          if (confirm === "no-show") return runStatus("NO_SHOW");
        }}
      />
      {checkInDesk}

      <Dialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title={force ? "Annullare un soggiorno già iniziato?" : webRequest ? "Rifiutare la richiesta?" : "Cancellare la prenotazione?"}
        description={
          force
            ? "Solo titolare o amministratore. La camera torna da pulire e il motivo resta nelle note."
            : webRequest
              ? "La camera torna libera. Il motivo resta nelle note."
              : `${reservation.code} torna subito in vendita. Il motivo resta nelle note. Le prenotazioni già incassate non vengono rimborsate da qui.`
        }
      >
        <form
          className="grid gap-4"
          onSubmit={async (event) => {
            event.preventDefault();
            setPending(true);
            const ok = await finish(await cancelReservationAction({ id: reservation.id, reason, force }));
            if (ok) setCancelOpen(false);
          }}
        >
          <Field label="Motivo">
            <Textarea value={reason} onChange={(event) => setReason(event.target.value)} required minLength={3} placeholder="Almeno 3 caratteri" />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setCancelOpen(false)}>
              Indietro
            </Button>
            <Button type="submit" variant="danger" pending={pending} disabled={reason.trim().length < 3}>
              {force ? "Annulla il soggiorno" : webRequest ? "Rifiuta la richiesta" : "Cancella prenotazione"}
            </Button>
          </div>
        </form>
      </Dialog>

      <Dialog open={payOpen} onOpenChange={setPayOpen} title="Registra pagamento">
        <form
          className="grid gap-4"
          onSubmit={async (event) => {
            event.preventDefault();
            const value = Number(amount.replace(",", "."));
            setPending(true);
            const result = await addReservationPaymentAction({ id: reservation.id, amount: value, method });
            setPending(false);
            if (reportAction(`pay-${reservation.id}`, result, `Pagamento di ${formatMoneyExact(value)} registrato.`)) {
              setPayOpen(false);
              onChanged();
            }
          }}
        >
          <Field label="Importo">
            <Input inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} required />
          </Field>
          <Field label="Metodo">
            <Select value={method} onChange={(event) => setMethod(event.target.value as typeof method)}>
              {PAYMENT_METHODS.map(([value, name]) => (
                <option key={value} value={value}>
                  {name}
                </option>
              ))}
            </Select>
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setPayOpen(false)}>
              Annulla
            </Button>
            <Button type="submit" pending={pending}>
              Conferma pagamento
            </Button>
          </div>
        </form>
      </Dialog>

      <Dialog open={extraOpen} onOpenChange={setExtraOpen} title="Aggiungi extra">
        <form
          className="grid gap-4"
          onSubmit={async (event) => {
            event.preventDefault();
            const qty = Number(quantity);
            setPending(true);
            const result = await addReservationExtraAction(reservation.id, extraId, qty);
            setPending(false);
            if (reportAction(`extra-${reservation.id}`, result, "Extra aggiunto. Il totale è stato ricalcolato.")) {
              setExtraOpen(false);
              onChanged();
            }
          }}
        >
          <Field label="Extra">
            <Select value={extraId} onChange={(event) => setExtraId(event.target.value)}>
              {extras.map((extra) => (
                <option key={extra.id} value={extra.id}>
                  {extra.name} · {formatMoneyExact(extra.price)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Quantità">
            <Input inputMode="numeric" value={quantity} onChange={(event) => setQuantity(event.target.value)} required />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setExtraOpen(false)}>
              Annulla
            </Button>
            <Button type="submit" pending={pending} disabled={!extraId}>
              Conferma extra
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}

function allowed(action: DeskAction, permissions: DeskPermissions, canOpenModify: boolean) {
  if (action === "modify") return permissions.canModify && canOpenModify;
  if (action === "cancel") return permissions.canCancel;
  if (action === "confirm" || action === "option") return permissions.canWrite;
  if (action === "check-in" || action === "check-out" || action === "no-show") return permissions.canCheckIn;
  if (action === "payment") return permissions.canPay;
  if (action === "extra") return permissions.canExtra;
  return false;
}

function quickTitle(action: "confirm" | "check-in" | "check-out") {
  if (action === "confirm") return "Conferma il soggiorno";
  if (action === "check-in") return "Registra il check-in";
  return "Registra il check-out";
}

function label(action: DeskAction, noExtras: boolean, webRequest = false) {
  switch (action) {
    case "confirm":
      return "Conferma";
    case "option":
      return "Metti in opzione";
    case "check-in":
      return "Check-in";
    case "check-out":
      return "Check-out";
    case "modify":
      return "Modifica";
    case "cancel":
      return webRequest ? "Rifiuta" : "Cancella";
    case "no-show":
      return "No-show";
    case "extra":
      return noExtras ? "Nessun extra attivo" : "Aggiungi extra";
    case "payment":
      return "Aggiungi pagamento";
  }
}
