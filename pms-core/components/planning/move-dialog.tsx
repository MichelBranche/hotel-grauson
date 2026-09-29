"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { moveReservationAction, previewReservationChangeAction } from "@pms-core/actions/reservations";
import { settleAction } from "@pms-core/components/ui/action-feedback";
import { Button } from "@pms-core/components/ui/button";
import { Dialog } from "@pms-core/components/ui/dialog";
import { Field, Input, Select } from "@pms-core/components/ui/input";
import { formatMoneyExact } from "@pms-core/lib/money";
import type { PlanningReservation, PlanningRoom } from "@pms-core/types";

type Quote = {
  before: { nights: number; total: number };
  after: { nights: number; total: number };
};

type SavedMove = Extract<Awaited<ReturnType<typeof moveReservationAction>>, { ok: true }>["data"];

export function MoveDialog({
  open,
  onOpenChange,
  reservation,
  rooms,
  plans,
  onSaved,
  onCommitted,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reservation: PlanningReservation | null;
  rooms: PlanningRoom[];
  plans: { id: string; code: string; name: string }[];
  onSaved: (next: SavedMove) => void;
  onCommitted?: () => void;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Modifica prenotazione"
      description="Date, camera o tariffa vengono ricalcolate con le stagioni. Il totale precedente e quello nuovo sono qui sotto."
    >
      {open && reservation ? (
        <MoveForm
          key={reservation.id}
          reservation={reservation}
          rooms={rooms}
          plans={plans}
          onClose={() => onOpenChange(false)}
          onSaved={onSaved}
          onCommitted={onCommitted}
        />
      ) : null}
    </Dialog>
  );
}

function MoveForm({
  reservation,
  rooms,
  plans,
  onClose,
  onSaved,
  onCommitted,
}: {
  reservation: PlanningReservation;
  rooms: PlanningRoom[];
  plans: { id: string; code: string; name: string }[];
  onClose: () => void;
  onSaved: (next: SavedMove) => void;
  onCommitted?: () => void;
}) {
  const [roomId, setRoomId] = useState(reservation.roomId);
  const [checkIn, setCheckIn] = useState(reservation.checkIn);
  const [checkOut, setCheckOut] = useState(reservation.checkOut);
  const [adults, setAdults] = useState(String(reservation.adults));
  const [children, setChildren] = useState(String(reservation.children));
  const [ratePlanId, setRatePlanId] = useState(reservation.ratePlanId ?? plans[0]?.id ?? "");
  const [firstName, setFirstName] = useState(reservation.guestFirstName);
  const [lastName, setLastName] = useState(reservation.guestLastName);
  const [email, setEmail] = useState(reservation.email ?? "");
  const [phone, setPhone] = useState(reservation.phone ?? "");
  const [preview, setPreview] = useState<{ key: string; quote: Quote | null; error: string | null } | null>(null);
  const [pending, setPending] = useState(false);
  const adultCount = Number(adults);
  const childCount = Number(children);
  const inputsValid =
    Boolean(roomId) &&
    checkOut > checkIn &&
    Number.isInteger(adultCount) &&
    adultCount >= 1 &&
    Number.isInteger(childCount) &&
    childCount >= 0;
  const previewKey = `${reservation.id}|${roomId}|${checkIn}|${checkOut}|${adultCount}|${childCount}|${ratePlanId}`;
  const live = preview?.key === previewKey ? preview : null;

  useEffect(() => {
    if (!inputsValid) return;
    let cancelled = false;
    const handle = setTimeout(() => {
      void previewReservationChangeAction({
        id: reservation.id,
        roomId,
        checkIn,
        checkOut,
        adults: adultCount,
        children: childCount,
        ratePlanId: ratePlanId || null,
      }).then((result) => {
        if (cancelled) return;
        setPreview(
          result.ok
            ? { key: previewKey, quote: result.data, error: null }
            : { key: previewKey, quote: null, error: result.error },
        );
      });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [inputsValid, previewKey, reservation.id, roomId, checkIn, checkOut, adultCount, childCount, ratePlanId]);

  const planChoices =
    reservation.ratePlanId && !plans.some((plan) => plan.id === reservation.ratePlanId)
      ? [{ id: reservation.ratePlanId, code: "", name: "Tariffa attuale" }, ...plans]
      : plans;

  return (
      <form
        className="grid gap-4"
        onSubmit={async (event) => {
          event.preventDefault();
          if (!live?.quote) return;
          setPending(true);
          const result = await settleAction(() =>
            moveReservationAction({
              id: reservation.id,
              roomId,
              checkIn,
              checkOut,
              adults: Number(adults),
              children: Number(children),
              ratePlanId: ratePlanId || null,
              guest: { firstName, lastName, email, phone },
            }),
          );
          setPending(false);
          if ("committed" in result) {
            toast.success("Prenotazione aggiornata.", { id: `move-${reservation.id}` });
            onCommitted?.();
            onClose();
            return;
          }
          if (!result.ok) {
            setPreview({ key: previewKey, quote: null, error: result.error });
            return;
          }
          onSaved(result.data);
          onClose();
        }}
      >
        <Field label="Camera">
          <Select value={roomId} onChange={(event) => setRoomId(event.target.value)}>
            {rooms
              .filter((room) => room.active !== false || room.id === reservation.roomId)
              .map((room) => (
                <option key={room.id} value={room.id}>
                  {room.number} · {room.roomTypeName}
                </option>
              ))}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Check-in">
            <Input type="date" value={checkIn} onChange={(event) => setCheckIn(event.target.value)} required />
          </Field>
          <Field label="Check-out">
            <Input type="date" value={checkOut} onChange={(event) => setCheckOut(event.target.value)} required />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Adulti">
            <Input inputMode="numeric" value={adults} onChange={(event) => setAdults(event.target.value)} required />
          </Field>
          <Field label="Bambini">
            <Input inputMode="numeric" value={children} onChange={(event) => setChildren(event.target.value)} required />
          </Field>
        </div>
        {planChoices.length ? (
          <Field label="Tariffa">
            <Select value={ratePlanId} onChange={(event) => setRatePlanId(event.target.value)}>
              {planChoices.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.code ? `${plan.name} · ${plan.code}` : plan.name}
                </option>
              ))}
            </Select>
          </Field>
        ) : null}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nome">
            <Input value={firstName} onChange={(event) => setFirstName(event.target.value)} required />
          </Field>
          <Field label="Cognome">
            <Input value={lastName} onChange={(event) => setLastName(event.target.value)} required />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Email">
            <Input type="text" inputMode="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </Field>
          <Field label="Telefono">
            <Input value={phone} onChange={(event) => setPhone(event.target.value)} />
          </Field>
        </div>
        <div className="rounded-2xl bg-white/70 px-4 py-3 text-sm">
          {inputsValid && !live ? <p className="text-[var(--pms-muted)]">Calcolo del nuovo totale…</p> : null}
          {live?.quote ? (
            <p>
              Prima {formatMoneyExact(live.quote.before.total)} · {live.quote.before.nights} {live.quote.before.nights === 1 ? "notte" : "notti"}
              <span className="mx-2 text-[var(--pms-muted)]">→</span>
              <span className="font-semibold">
                Dopo {formatMoneyExact(live.quote.after.total)} · {live.quote.after.nights} {live.quote.after.nights === 1 ? "notte" : "notti"}
              </span>
            </p>
          ) : null}
          {checkOut <= checkIn ? <p className="text-[#8a3b3b]">Il check-out deve essere successivo al check-in.</p> : null}
        </div>
        {live?.error ? <p className="text-sm text-[#8a3b3b]">{live.error}</p> : null}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Annulla
          </Button>
          <Button type="submit" disabled={pending || !live?.quote}>
            {pending ? "Salvataggio…" : "Conferma modifica"}
          </Button>
        </div>
      </form>
  );
}
