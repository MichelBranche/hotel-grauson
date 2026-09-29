"use client";

import { useMemo, useState } from "react";

import { BookingOffers } from "@/components/booking/BookingOffers";
import { BookingSearch } from "@/components/booking/BookingSearch";
import { catalogForType, rateLabel } from "@/lib/booking-catalog";
import { hotel } from "@/lib/content";
import { publicAvailabilityAction, publicCreateReservationAction } from "@pms-core/actions/booking";
import { chargedDepositPercent, depositEuros } from "@pms-core/lib/deposit";
import { formatRange, nightsBetween } from "@pms-core/lib/dates";
import { formatMoney, formatMoneyExact } from "@pms-core/lib/money";
import type { AvailabilityOffer } from "@pms-core/types";

const MISSING_GUEST = "Inserisci nome, cognome ed email.";

function guestMessage(guest: { firstName: string; lastName: string; email: string }) {
  const firstName = guest.firstName.trim();
  const lastName = guest.lastName.trim();
  const email = guest.email.trim();
  if (!firstName || !lastName || !email) return MISSING_GUEST;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Inserisci un'email valida.";
  return null;
}

export function BookingFlow({
  checkIn: initialIn = "",
  checkOut: initialOut = "",
  adults: initialAdults = 2,
  initialOffers = [],
  initialNotices = [],
  initialError = null,
  checkoutCancelled = false,
}: {
  checkIn?: string;
  checkOut?: string;
  adults?: number;
  initialOffers?: AvailabilityOffer[];
  initialNotices?: string[];
  initialError?: string | null;
  checkoutCancelled?: boolean;
}) {
  const [checkIn, setCheckIn] = useState(initialIn);
  const [checkOut, setCheckOut] = useState(initialOut);
  const [adults, setAdults] = useState(initialAdults);
  const [offers, setOffers] = useState(initialOffers);
  const [notices, setNotices] = useState(initialNotices);
  const [searched, setSearched] = useState(initialOffers.length > 0 || initialNotices.length > 0);
  const [roomTypeId, setRoomTypeId] = useState("");
  const [ratePlanId, setRatePlanId] = useState("");
  const [guest, setGuest] = useState({ firstName: "", lastName: "", email: "", phone: "" });
  const [error, setError] = useState<string | null>(initialError);
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
    setSearching(true);
    try {
      const result = await publicAvailabilityAction({ checkIn, checkOut, adults });
      setSearched(true);
      if (!result.ok) {
        setOffers([]);
        setNotices([]);
        setRoomTypeId("");
        setRatePlanId("");
        setError(result.error);
        return;
      }
      setOffers(result.data.offers);
      setNotices(result.data.notices);
      setRoomTypeId("");
      setRatePlanId("");
      document.getElementById("disponibilita")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch {
      setSearched(true);
      setOffers([]);
      setNotices([]);
      setError("Non riusciamo a verificare la disponibilità. Riprovate.");
    } finally {
      setSearching(false);
    }
  };

  const deposit = rate ? depositEuros(rate.total, rate.depositPercent) : 0;
  const depositPercent = rate ? chargedDepositPercent(rate.depositPercent) : 100;

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

      {checkoutCancelled ? (
        <p role="status" className="rounded-[var(--radius-card)] bg-[rgb(138_59_59_/_0.08)] px-5 py-4 text-[0.875rem] text-[#8a3b3b]">
          Pagamento annullato. La camera non è confermata: potete riprovare.
        </p>
      ) : null}

      <p className="px-1 text-[0.75rem] text-muted">
        Check-in dalle 15 · check-out entro le 10 · acconto online per confermare
      </p>

      <div id="disponibilita" className="scroll-mt-28">
        {error && offers.length === 0 ? (
          <p role="alert" className="rounded-[var(--radius-card)] bg-[rgb(138_59_59_/_0.08)] px-5 py-4 text-[0.875rem] text-[#8a3b3b]">
            {error}
          </p>
        ) : null}

        {searched && offers.length === 0 && !error ? (
          <div className="rounded-[var(--radius-panel)] bg-surface px-6 py-8 text-[0.95rem] leading-relaxed text-muted shadow-[var(--shadow-soft)]">
            {notices.length ? (
              <ul className="mb-3 space-y-1 text-ink">
                {notices.map((notice) => (
                  <li key={notice}>{notice}</li>
                ))}
              </ul>
            ) : null}
            <p>
              {notices.length ? "Provate altre date" : "Quelle notti sono già prese. Provate altre date"}, o chiamate il{" "}
              <a href={hotel.phoneHref} className="text-ink underline decoration-[rgb(37_39_33_/_0.25)] underline-offset-4">
                {hotel.phone}
              </a>
              .
            </p>
          </div>
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
                const opening = roomTypeId === "";
                setRoomTypeId(nextType);
                setRatePlanId(nextRate);
                if (opening) {
                  requestAnimationFrame(() => {
                    document.getElementById("prenotazione")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
                  });
                }
              }}
            />

            {selected && rate && catalog ? (
              <form
                id="prenotazione"
                aria-labelledby="prenotazione-title"
                className="scroll-mt-28 rounded-[var(--radius-panel)] border border-[rgb(37_39_33_/_0.06)] bg-paper p-5 shadow-[var(--shadow-soft)] sm:p-7"
                noValidate
                onSubmit={async (event) => {
                  event.preventDefault();
                  const message = guestMessage(guest);
                  if (message) {
                    setError(message);
                    return;
                  }
                  const roomId = selected.availableRooms[0]?.id;
                  if (!roomId) {
                    setError("Questa tipologia non ha più camere su quelle date.");
                    return;
                  }
                  setSending(true);
                  setError(null);
                  let leaving = false;
                  try {
                    const result = await publicCreateReservationAction({
                      roomId,
                      checkIn,
                      checkOut,
                      adults,
                      ratePlanId,
                      guest: {
                        ...guest,
                        firstName: guest.firstName.trim(),
                        lastName: guest.lastName.trim(),
                        email: guest.email.trim(),
                        phone: guest.phone.trim(),
                      },
                    });
                    if (!result.ok) {
                      setError(result.error);
                      return;
                    }
                    if (!result.data.checkoutUrl) {
                      setError("Non riusciamo ad aprire il pagamento. Riprovate.");
                      return;
                    }
                    window.location.assign(result.data.checkoutUrl);
                    leaving = true;
                  } catch {
                    setError("Il pagamento non è partito. Riprovate.");
                  } finally {
                    if (!leaving) setSending(false);
                  }
                }}
              >
                <p className="eyebrow text-muted">Acconto</p>
                <h3 id="prenotazione-title" className="display-md mt-2 max-w-[18ch]">
                  Confermate questa camera
                </h3>
                <p className="mt-3 max-w-[46ch] text-[0.875rem] leading-relaxed text-muted">
                  Nome, cognome ed email per la prenotazione. L&apos;acconto si paga ora e conferma il soggiorno.
                  {depositPercent < 100 ? " Il resto si salda in locanda." : ""}
                </p>
                <p className="mt-4 text-[0.875rem] text-ink">
                  {catalog.label} · {rateLabel(rate.name)} · {formatMoney(rate.total)}
                </p>

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  <label className="text-[0.75rem] text-muted">
                    Nome *
                    <input
                      required
                      aria-required="true"
                      autoComplete="given-name"
                      value={guest.firstName}
                      onChange={(event) => setGuest({ ...guest, firstName: event.target.value })}
                      className="mt-1.5 h-11 w-full rounded-[16px] border border-[rgb(37_39_33_/_0.08)] bg-surface px-3 text-[0.875rem] text-ink outline-none focus:border-alpine/40"
                    />
                  </label>
                  <label className="text-[0.75rem] text-muted">
                    Cognome *
                    <input
                      required
                      aria-required="true"
                      autoComplete="family-name"
                      value={guest.lastName}
                      onChange={(event) => setGuest({ ...guest, lastName: event.target.value })}
                      className="mt-1.5 h-11 w-full rounded-[16px] border border-[rgb(37_39_33_/_0.08)] bg-surface px-3 text-[0.875rem] text-ink outline-none focus:border-alpine/40"
                    />
                  </label>
                  <label className="text-[0.75rem] text-muted">
                    Email *
                    <input
                      required
                      aria-required="true"
                      type="email"
                      autoComplete="email"
                      value={guest.email}
                      onChange={(event) => setGuest({ ...guest, email: event.target.value })}
                      className="mt-1.5 h-11 w-full rounded-[16px] border border-[rgb(37_39_33_/_0.08)] bg-surface px-3 text-[0.875rem] text-ink outline-none focus:border-alpine/40"
                    />
                  </label>
                  <label className="text-[0.75rem] text-muted">
                    Telefono
                    <input
                      type="tel"
                      autoComplete="tel"
                      value={guest.phone}
                      onChange={(event) => setGuest({ ...guest, phone: event.target.value })}
                      className="mt-1.5 h-11 w-full rounded-[16px] border border-[rgb(37_39_33_/_0.08)] bg-surface px-3 text-[0.875rem] text-ink outline-none focus:border-alpine/40"
                    />
                  </label>
                </div>

                {error ? (
                  <p role="alert" className="mt-6 rounded-[var(--radius-card)] bg-[rgb(138_59_59_/_0.08)] px-5 py-4 text-[0.875rem] text-[#8a3b3b]">
                    {error}
                  </p>
                ) : null}

                <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2">
                  <button
                    type="submit"
                    disabled={sending}
                    aria-busy={sending || undefined}
                    className="h-[3.125rem] rounded-full bg-accent px-7 text-[0.8125rem] font-medium text-surface transition-colors duration-500 hover:bg-accent-hover disabled:opacity-60"
                  >
                    {sending ? "Apertura del pagamento…" : `Paga ${formatMoneyExact(deposit)}`}
                  </button>
                  <p className="text-[0.8125rem] text-muted">
                    {depositPercent < 100 ? `Acconto ${depositPercent}%` : "Intero soggiorno"}
                  </p>
                </div>
              </form>
            ) : (
              <p className="max-w-[46ch] px-1 text-[0.875rem] leading-relaxed text-muted">
                Scegliete una tariffa per vedere l&apos;acconto e confermare la camera.
              </p>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
