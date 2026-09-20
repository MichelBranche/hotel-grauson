"use client";

import { useMemo, useState } from "react";

import { publicAvailabilityAction, publicCreateReservationAction } from "@pms-core/actions/booking";
import { formatMoney } from "@pms-core/lib/money";
import type { AvailabilityOffer } from "@pms-core/types";

export function BookingWizard({
  checkIn: initialIn,
  checkOut: initialOut,
  adults: initialAdults,
}: {
  checkIn?: string;
  checkOut?: string;
  adults?: number;
}) {
  const [checkIn, setCheckIn] = useState(initialIn ?? "");
  const [checkOut, setCheckOut] = useState(initialOut ?? "");
  const [adults, setAdults] = useState(initialAdults ?? 2);
  const [offers, setOffers] = useState<AvailabilityOffer[]>([]);
  const [roomId, setRoomId] = useState("");
  const [ratePlanId, setRatePlanId] = useState("");
  const [guest, setGuest] = useState({ firstName: "", lastName: "", email: "", phone: "" });
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const selected = useMemo(
    () => offers.find((offer) => offer.availableRooms.some((room) => room.id === roomId)),
    [offers, roomId],
  );
  const rate = selected?.ratePlans.find((item) => item.id === ratePlanId);

  return (
    <div className="rounded-[30px] border border-[rgb(37_39_33_/_0.07)] bg-surface p-6 shadow-[var(--shadow-soft)]">
      <h1 className="display-sm">Prenota</h1>
      <p className="mt-2 text-sm text-muted">Stessa disponibilità del PMS. Una sola prenotazione, un solo database.</p>

      <form
        className="mt-6 grid gap-4 md:grid-cols-4"
        onSubmit={async (event) => {
          event.preventDefault();
          setError(null);
          const result = await publicAvailabilityAction({ checkIn, checkOut, adults });
          if (!result.ok) {
            setError(result.error);
            return;
          }
          setOffers(result.data);
          const first = result.data[0];
          setRoomId(first?.availableRooms[0]?.id ?? "");
          setRatePlanId(first?.ratePlans[0]?.id ?? "");
        }}
      >
        <label className="text-sm">
          Check-in
          <input type="date" className="mt-1 w-full rounded-2xl border border-[rgb(37_39_33_/_0.08)] bg-white/70 px-3 py-2" value={checkIn} onChange={(event) => setCheckIn(event.target.value)} required />
        </label>
        <label className="text-sm">
          Check-out
          <input type="date" className="mt-1 w-full rounded-2xl border border-[rgb(37_39_33_/_0.08)] bg-white/70 px-3 py-2" value={checkOut} onChange={(event) => setCheckOut(event.target.value)} required />
        </label>
        <label className="text-sm">
          Adulti
          <input type="number" min={1} className="mt-1 w-full rounded-2xl border border-[rgb(37_39_33_/_0.08)] bg-white/70 px-3 py-2" value={adults} onChange={(event) => setAdults(Number(event.target.value))} />
        </label>
        <button type="submit" className="self-end rounded-full bg-alpine px-5 py-2.5 text-sm text-surface">
          Cerca disponibilità
        </button>
      </form>

      {offers.length > 0 ? (
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr]">
          <ul className="space-y-3">
            {offers.map((offer) => (
              <li key={offer.roomTypeId} className="rounded-2xl border border-[rgb(37_39_33_/_0.07)] p-4">
                <p className="font-medium">{offer.roomTypeName}</p>
                <p className="text-sm text-muted">{offer.remaining} camere</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {offer.availableRooms.map((room) => (
                    <button
                      key={room.id}
                      type="button"
                      onClick={() => {
                        setRoomId(room.id);
                        setRatePlanId(offer.ratePlans[0]?.id ?? "");
                      }}
                      className={`rounded-full px-3 py-1 text-sm ${roomId === room.id ? "bg-alpine text-surface" : "bg-surface-deep"}`}
                    >
                      {room.number}
                    </button>
                  ))}
                </div>
                <div className="mt-3 space-y-1 text-sm">
                  {offer.ratePlans.map((plan) => (
                    <button key={plan.id} type="button" className="block" onClick={() => setRatePlanId(plan.id)}>
                      {plan.name} · {formatMoney(plan.total)} {ratePlanId === plan.id ? "✓" : ""}
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
          <form
            className="grid gap-3"
            onSubmit={async (event) => {
              event.preventDefault();
              setPending(true);
              const result = await publicCreateReservationAction({
                roomId,
                checkIn,
                checkOut,
                adults,
                ratePlanId,
                guest,
              });
              setPending(false);
              if (!result.ok) {
                setError(result.error);
                return;
              }
              setCode(result.data.code ?? "");
            }}
          >
            <input className="rounded-2xl border border-[rgb(37_39_33_/_0.08)] px-3 py-2" placeholder="Nome" value={guest.firstName} onChange={(event) => setGuest({ ...guest, firstName: event.target.value })} required />
            <input className="rounded-2xl border border-[rgb(37_39_33_/_0.08)] px-3 py-2" placeholder="Cognome" value={guest.lastName} onChange={(event) => setGuest({ ...guest, lastName: event.target.value })} required />
            <input className="rounded-2xl border border-[rgb(37_39_33_/_0.08)] px-3 py-2" type="email" placeholder="Email" value={guest.email} onChange={(event) => setGuest({ ...guest, email: event.target.value })} required />
            <input className="rounded-2xl border border-[rgb(37_39_33_/_0.08)] px-3 py-2" placeholder="Telefono" value={guest.phone} onChange={(event) => setGuest({ ...guest, phone: event.target.value })} />
            <p className="text-sm text-muted">{rate ? `${rate.name} · ${formatMoney(rate.total)}` : "Seleziona camera e tariffa"}</p>
            <button type="submit" disabled={pending || !roomId} className="rounded-full bg-alpine px-5 py-2.5 text-sm text-surface">
              Conferma prenotazione
            </button>
          </form>
        </div>
      ) : null}

      {error ? <p className="mt-4 text-sm text-[#8a3b3b]">{error}</p> : null}
      {code ? <p className="mt-4 text-sm">Prenotazione confermata: {code}. La reception la vede subito nel planning.</p> : null}
    </div>
  );
}
