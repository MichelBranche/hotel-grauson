"use client";

import { useMemo, useState } from "react";

import { createReservationAction } from "@pms-core/actions/reservations";
import { getAvailabilityAction } from "@pms-core/actions/lookups";
import { Button } from "@pms-core/components/ui/button";
import { Dialog } from "@pms-core/components/ui/dialog";
import { Field, Input, Textarea } from "@pms-core/components/ui/input";
import { formatMoney } from "@pms-core/lib/money";
import type { AvailabilityOffer, AvailabilityResult, PlanningReservation } from "@pms-core/types";

const steps = [
  "Date",
  "Disponibilità",
  "Camera",
  "Ospite",
  "Tariffa",
  "Extra",
  "Pagamento",
  "Riepilogo",
  "Conferma",
];

function seasonSummary(nights: AvailabilityOffer["ratePlans"][number]["nights"]) {
  const counts = new Map<string, number>();
  for (const night of nights) if (night.season) counts.set(night.season, (counts.get(night.season) ?? 0) + 1);
  return [...counts].map(([name, count]) => `${count} ${count === 1 ? "notte" : "notti"} ${name}`).join(" · ");
}

export function NewReservationWizard({
  open,
  onOpenChange,
  extras,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  extras: { id: string; name: string; price: number }[];
  onCreated: (stay: Omit<PlanningReservation, "color">) => void | Promise<void>;
}) {
  const [step, setStep] = useState(0);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [offers, setOffers] = useState<AvailabilityOffer[]>([]);
  const [unavailable, setUnavailable] = useState<AvailabilityResult["unavailable"]>([]);
  const [roomTypeId, setRoomTypeId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [ratePlanId, setRatePlanId] = useState("");
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [guest, setGuest] = useState({ firstName: "", lastName: "", email: "", phone: "" });
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [pending, setPending] = useState<"search" | "save" | null>(null);

  const offer = offers.find((item) => item.roomTypeId === roomTypeId);
  const rate = offer?.ratePlans.find((item) => item.id === ratePlanId);

  const extraTotal = useMemo(
    () => extras.filter((item) => selectedExtras.includes(item.id)).reduce((sum, item) => sum + item.price, 0),
    [extras, selectedExtras],
  );

  async function loadAvailability() {
    const result = await getAvailabilityAction({ checkIn, checkOut, adults, children });
    if (!result.ok) {
      setError(result.error);
      return false;
    }
    const { offers: found, unavailable: refused } = result.data;
    setOffers(found);
    setUnavailable(refused);
    if (found[0]) {
      setRoomTypeId(found[0].roomTypeId);
      setRoomId(found[0].availableRooms[0]?.id ?? "");
      setRatePlanId(found[0].ratePlans[0]?.id ?? "");
      setPaymentAmount(Math.round((found[0].ratePlans[0]?.total ?? 0) * 0.3));
    } else {
      setRoomTypeId("");
      setRoomId("");
      setRatePlanId("");
    }
    return true;
  }

  async function next() {
    setError(null);
    if (step === 0) {
      setPending("search");
      const ok = await loadAvailability();
      setPending(null);
      if (!ok) return;
    }
    setStep((value) => Math.min(value + 1, steps.length - 1));
  }

  async function confirm() {
    setPending("save");
    const result = await createReservationAction({
      roomId,
      checkIn,
      checkOut,
      adults,
      children,
      ratePlanId,
      extras: selectedExtras.map((extraId) => ({ extraId, quantity: 1 })),
      guest,
      notes,
      payment: paymentAmount > 0 ? { amount: paymentAmount, method: "CARD" } : undefined,
    });
    if (!result.ok) {
      setPending(null);
      setError(result.error);
      return;
    }
    setCode(result.data.code ?? result.data.id ?? "");
    setStep(8);
    await onCreated(result.data);
    setPending(null);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Nuova prenotazione" className="max-w-2xl">
      <p className="mb-4 text-xs tracking-[0.16em] text-[var(--pms-muted)] uppercase">
        Passo {step + 1} / {steps.length} · {steps[step]}
      </p>

      {step === 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Check-in">
            <Input type="date" value={checkIn} onChange={(event) => setCheckIn(event.target.value)} />
          </Field>
          <Field label="Check-out">
            <Input type="date" value={checkOut} onChange={(event) => setCheckOut(event.target.value)} />
          </Field>
          <Field label="Adulti">
            <Input type="number" min={1} value={adults} onChange={(event) => setAdults(Number(event.target.value))} />
          </Field>
          <Field label="Bambini">
            <Input type="number" min={0} value={children} onChange={(event) => setChildren(Number(event.target.value))} />
          </Field>
        </div>
      ) : null}

      {step === 1 ? (
        <ul className="space-y-2">
          {offers.length === 0 ? (
            <li className="rounded-2xl border border-dashed border-[var(--pms-line)] px-4 py-5 text-sm text-[var(--pms-muted)]">
              Nessuna camera vendibile per queste date. Torna indietro e cambia date od ospiti.
            </li>
          ) : null}
          {offers.map((item) => (
            <li key={item.roomTypeId}>
              <button
                type="button"
                onClick={() => {
                  setRoomTypeId(item.roomTypeId);
                  setRoomId(item.availableRooms[0]?.id ?? "");
                  setRatePlanId(item.ratePlans[0]?.id ?? "");
                }}
                className={`w-full rounded-2xl border px-4 py-3 text-left ${roomTypeId === item.roomTypeId ? "border-[var(--pms-alpine)] bg-white" : "border-[var(--pms-line)]"}`}
              >
                <p className="flex items-baseline justify-between gap-3 font-medium">
                  <span>{item.roomTypeName}</span>
                  {item.ratePlans[0] ? (
                    <span className="text-sm tabular-nums">da {formatMoney(Math.min(...item.ratePlans.map((plan) => plan.total)))}</span>
                  ) : null}
                </p>
                <p className="text-xs text-[var(--pms-muted)]">{item.remaining} camere · fino a {item.capacity} ospiti</p>
              </button>
            </li>
          ))}
          {unavailable.map((item) => (
            <li
              key={item.roomTypeId}
              className="flex items-baseline justify-between gap-3 rounded-2xl border border-[var(--pms-line)] bg-[var(--pms-surface-dark)]/40 px-4 py-3 text-sm"
            >
              <span className="text-[var(--pms-muted)]">{item.roomTypeName}</span>
              <span className="text-right text-xs">{item.reason}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {step === 2 ? (
        <ul className="grid grid-cols-3 gap-2">
          {offer?.availableRooms.map((room) => (
            <li key={room.id}>
              <button
                type="button"
                onClick={() => setRoomId(room.id)}
                className={`h-12 w-full rounded-2xl border ${roomId === room.id ? "border-[var(--pms-alpine)] bg-white" : "border-[var(--pms-line)]"}`}
              >
                {room.number}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {step === 3 ? (
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Nome">
            <Input value={guest.firstName} onChange={(event) => setGuest({ ...guest, firstName: event.target.value })} />
          </Field>
          <Field label="Cognome">
            <Input value={guest.lastName} onChange={(event) => setGuest({ ...guest, lastName: event.target.value })} />
          </Field>
          <Field label="Email">
            <Input value={guest.email} onChange={(event) => setGuest({ ...guest, email: event.target.value })} />
          </Field>
          <Field label="Telefono">
            <Input value={guest.phone} onChange={(event) => setGuest({ ...guest, phone: event.target.value })} />
          </Field>
        </div>
      ) : null}

      {step === 4 ? (
        <ul className="space-y-2">
          {offer?.ratePlans.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => setRatePlanId(item.id)}
                className={`w-full rounded-2xl border px-4 py-3 text-left ${ratePlanId === item.id ? "border-[var(--pms-alpine)] bg-white" : "border-[var(--pms-line)]"}`}
              >
                <p className="font-medium">{item.name}</p>
                <p className="text-xs text-[var(--pms-muted)]">
                  {formatMoney(item.total)} · {formatMoney(item.nightly)} a notte · {item.refundable ? "Rimborsabile" : "Non rimborsabile"}
                  {item.minimumStay > 1 ? ` · min. ${item.minimumStay} notti` : ""}
                </p>
                {seasonSummary(item.nights) ? (
                  <p className="mt-0.5 text-xs text-[var(--pms-muted)]">{seasonSummary(item.nights)}</p>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {step === 5 ? (
        <ul className="space-y-2">
          {extras.map((item) => (
            <li key={item.id}>
              <label className="flex items-center justify-between rounded-2xl border border-[var(--pms-line)] px-4 py-3">
                <span>
                  {item.name}
                  <span className="ml-2 text-xs text-[var(--pms-muted)]">{formatMoney(item.price)}</span>
                </span>
                <input
                  type="checkbox"
                  checked={selectedExtras.includes(item.id)}
                  onChange={(event) =>
                    setSelectedExtras((current) =>
                      event.target.checked ? [...current, item.id] : current.filter((id) => id !== item.id),
                    )
                  }
                />
              </label>
            </li>
          ))}
        </ul>
      ) : null}

      {step === 6 ? (
        <Field label="Acconto">
          <Input type="number" min={0} value={paymentAmount} onChange={(event) => setPaymentAmount(Number(event.target.value))} />
        </Field>
      ) : null}

      {step === 7 ? (
        <div className="space-y-2 text-sm">
          <p>
            {guest.lastName} {guest.firstName} · {adults} adulti
          </p>
          <p>
            {checkIn} → {checkOut} · camera {offer?.availableRooms.find((room) => room.id === roomId)?.number}
          </p>
          <p>{rate?.name} · {formatMoney((rate?.total ?? 0) + extraTotal)}</p>
          <Field label="Note">
            <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} />
          </Field>
        </div>
      ) : null}

      {step === 8 ? (
        <p className="text-sm">
          Prenotazione confermata{code ? `: ${code}` : ""}.
        </p>
      ) : null}

      {error ? <p className="mt-3 text-sm text-[#8a3b3b]">{error}</p> : null}

      <div className="mt-6 flex justify-between">
        <Button type="button" variant="ghost" onClick={() => setStep((value) => Math.max(0, value - 1))} disabled={step === 0 || step === 8}>
          Indietro
        </Button>
        {step < 7 ? (
          <Button
            type="button"
            onClick={() => void next()}
            pending={pending === "search"}
            pendingLabel="Ricerca…"
            disabled={pending !== null || (step === 0 && (!checkIn || !checkOut)) || (step >= 1 && (!roomId || !ratePlanId))}
          >
            Continua
          </Button>
        ) : step === 7 ? (
          <Button type="button" onClick={() => void confirm()} pending={pending === "save"} disabled={pending !== null || !guest.firstName || !guest.lastName}>
            Conferma
          </Button>
        ) : (
          <Button type="button" onClick={() => onOpenChange(false)}>
            Chiudi
          </Button>
        )}
      </div>
    </Dialog>
  );
}
