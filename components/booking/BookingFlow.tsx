"use client";

import { useMemo, useState } from "react";

import { BookingOffers } from "@/components/booking/BookingOffers";
import { BookingSearch } from "@/components/booking/BookingSearch";
import { catalogForType, preferRate, rateLabel } from "@/lib/booking-catalog";
import { hotel } from "@/lib/content";
import { publicAvailabilityAction, publicCreateReservationAction } from "@pms-core/actions/booking";
import { formatRange, nightsBetween } from "@pms-core/lib/dates";
import { formatMoney } from "@pms-core/lib/money";
import type { AvailabilityOffer } from "@pms-core/types";

export function BookingFlow({
  checkIn: initialIn = "",
  checkOut: initialOut = "",
  adults: initialAdults = 2,
  initialOffers = [],
}: {
  checkIn?: string;
  checkOut?: string;
  adults?: number;
  initialOffers?: AvailabilityOffer[];
}) {
  const [checkIn, setCheckIn] = useState(initialIn);
  const [checkOut, setCheckOut] = useState(initialOut);
  const [adults, setAdults] = useState(initialAdults);
  const [offers, setOffers] = useState(initialOffers);
  const [searched, setSearched] = useState(initialOffers.length > 0);
  const [roomTypeId, setRoomTypeId] = useState(initialOffers[0]?.roomTypeId ?? "");
  const [ratePlanId, setRatePlanId] = useState(preferRate(initialOffers[0]?.ratePlans ?? [])?.id ?? "");
  const [guest, setGuest] = useState({ firstName: "", lastName: "", email: "", phone: "" });
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [sending, setSending] = useState(false);

  const nights = checkIn && checkOut ? nightsBetween(checkIn, checkOut) : 0;
  const selected = useMemo(
    () => offers.find((offer) => offer.roomTypeId === roomTypeId),
    [offers, roomTypeId],
  );
  const rate = selected?.ratePlans.find((plan) => plan.id === ratePlanId);
  const catalog = selected ? catalogForType(selected.roomTypeName) : null;

  const search = async () => {
    setError(null);
    setCode(null);
    setSearching(true);
    const result = await publicAvailabilityAction({ checkIn, checkOut, adults });
    setSearching(false);
    setSearched(true);
    if (!result.ok) {
      setOffers([]);
      setRoomTypeId("");
      setRatePlanId("");
      setError(result.error);
      return;
    }
    setOffers(result.data);
    const first = result.data[0];
    const preferred = first ? preferRate(first.ratePlans) : undefined;
    setRoomTypeId(first?.roomTypeId ?? "");
    setRatePlanId(preferred?.id ?? "");
    document.getElementById("disponibilita")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (code) {
    return (
      <section className="rounded-[var(--radius-panel)] border border-[rgb(37_39_33_/_0.06)] bg-surface px-6 py-10 shadow-[var(--shadow-soft)] sm:px-10 sm:py-14">
        <p className="eyebrow text-muted">Richiesta inviata</p>
        <h2 className="display-lg mt-4 max-w-[16ch]">Vi aspettiamo a Gimillan</h2>
        <p className="lede mt-5 max-w-[36ch]">
          Codice {code}. Vi confermiamo a {guest.email || "questa email"}.
          {checkIn && checkOut ? ` ${formatRange(checkIn, checkOut)}.` : ""}
        </p>
        <p className="mt-8 text-[0.875rem] text-muted">
          Per qualsiasi cosa, {hotel.phone} · {hotel.email}
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-7">
      <BookingSearch
        checkIn={checkIn}
        checkOut={checkOut}
        adults={adults}
        pending={searching}
        onCheckIn={(value) => {
          setCheckIn(value);
          setSearched(false);
          setOffers([]);
        }}
        onCheckOut={(value) => {
          setCheckOut(value);
          setSearched(false);
          setOffers([]);
        }}
        onAdults={(value) => {
          setAdults(value);
          setSearched(false);
          setOffers([]);
        }}
        onSubmit={() => void search()}
      />

      <p className="px-1 text-[0.75rem] text-muted">
        Check-in dalle 15 · check-out entro le 10 · pagamento in locanda
      </p>

      <div id="disponibilita" className="scroll-mt-28">
        {error ? (
          <p role="alert" className="rounded-[var(--radius-card)] bg-[rgb(138_59_59_/_0.08)] px-5 py-4 text-[0.875rem] text-[#8a3b3b]">
            {error}
          </p>
        ) : null}

        {searched && offers.length === 0 && !error ? (
          <p className="rounded-[var(--radius-panel)] bg-surface px-6 py-8 text-[0.95rem] leading-relaxed text-muted shadow-[var(--shadow-soft)]">
            Quelle notti sono già prese. Provate altre date, o chiamate il{" "}
            <a href={hotel.phoneHref} className="text-ink underline decoration-[rgb(37_39_33_/_0.25)] underline-offset-4">
              {hotel.phone}
            </a>
            .
          </p>
        ) : null}

        {offers.length > 0 ? (
          <div className="space-y-5">
            <div>
              <p className="eyebrow text-muted">Disponibilità</p>
              <h2 className="display-md mt-2">
                {nights} {nights === 1 ? "notte" : "notti"}
                {checkIn && checkOut ? ` · ${formatRange(checkIn, checkOut)}` : ""}
              </h2>
            </div>

            <BookingOffers
              offers={offers}
              nights={nights}
              roomTypeId={roomTypeId}
              ratePlanId={ratePlanId}
              onSelect={(nextType, nextRate) => {
                setRoomTypeId(nextType);
                setRatePlanId(nextRate);
              }}
            />

            {selected && rate && catalog ? (
              <form
                className="rounded-[var(--radius-panel)] border border-[rgb(37_39_33_/_0.06)] bg-surface p-5 shadow-[var(--shadow-soft)] sm:p-7"
                onSubmit={async (event) => {
                  event.preventDefault();
                  const roomId = selected.availableRooms[0]?.id;
                  if (!roomId) {
                    setError("Questa tipologia non ha più camere su quelle date.");
                    return;
                  }
                  setSending(true);
                  setError(null);
                  const result = await publicCreateReservationAction({
                    roomId,
                    checkIn,
                    checkOut,
                    adults,
                    ratePlanId,
                    guest,
                  });
                  setSending(false);
                  if (!result.ok) {
                    setError(result.error);
                    return;
                  }
                  setCode(result.data.code ?? "");
                }}
              >
                <p className="eyebrow text-muted">I vostri recapiti</p>
                <h3 className="display-md mt-2">Lasciate i dati. Confermiamo noi.</h3>
                <p className="mt-3 max-w-[42ch] text-[0.875rem] leading-relaxed text-muted">
                  {catalog.label} · {rateLabel(rate.name)} · {formatMoney(rate.total)} — non è un pagamento online.
                </p>

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  <label className="text-[0.75rem] text-muted">
                    Nome
                    <input
                      required
                      autoComplete="given-name"
                      value={guest.firstName}
                      onChange={(event) => setGuest({ ...guest, firstName: event.target.value })}
                      className="mt-1.5 h-11 w-full rounded-[16px] border border-[rgb(37_39_33_/_0.08)] bg-paper/70 px-3 text-[0.875rem] text-ink outline-none focus:border-alpine/40"
                    />
                  </label>
                  <label className="text-[0.75rem] text-muted">
                    Cognome
                    <input
                      required
                      autoComplete="family-name"
                      value={guest.lastName}
                      onChange={(event) => setGuest({ ...guest, lastName: event.target.value })}
                      className="mt-1.5 h-11 w-full rounded-[16px] border border-[rgb(37_39_33_/_0.08)] bg-paper/70 px-3 text-[0.875rem] text-ink outline-none focus:border-alpine/40"
                    />
                  </label>
                  <label className="text-[0.75rem] text-muted">
                    Email
                    <input
                      required
                      type="email"
                      autoComplete="email"
                      value={guest.email}
                      onChange={(event) => setGuest({ ...guest, email: event.target.value })}
                      className="mt-1.5 h-11 w-full rounded-[16px] border border-[rgb(37_39_33_/_0.08)] bg-paper/70 px-3 text-[0.875rem] text-ink outline-none focus:border-alpine/40"
                    />
                  </label>
                  <label className="text-[0.75rem] text-muted">
                    Telefono
                    <input
                      type="tel"
                      autoComplete="tel"
                      value={guest.phone}
                      onChange={(event) => setGuest({ ...guest, phone: event.target.value })}
                      className="mt-1.5 h-11 w-full rounded-[16px] border border-[rgb(37_39_33_/_0.08)] bg-paper/70 px-3 text-[0.875rem] text-ink outline-none focus:border-alpine/40"
                    />
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={sending}
                  className="mt-7 h-[3.125rem] rounded-full bg-accent px-7 text-[0.8125rem] font-medium text-surface transition-colors duration-500 hover:bg-accent-hover disabled:opacity-60"
                >
                  {sending ? "Invio…" : "Invia la richiesta"}
                </button>
              </form>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
