"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";

import { AvailableRooms } from "@/components/booking/AvailableRooms";
import { BookingSummary } from "@/components/booking/BookingSummary";
import { guestLabel, nightLabel } from "@/components/booking/copy";
import { CustomerDetailsForm } from "@/components/booking/CustomerDetailsForm";
import { validateStayDates } from "@/components/booking/dates";
import { DateSelection } from "@/components/booking/DateSelection";
import { GuestCount, validateGuestCounts } from "@/components/booking/GuestCount";
import { bookingErrorClass, bookingPanelClass, bookingQuietButtonClass } from "@/components/booking/styles";
import { emptyCustomer, type CustomerDetails, type GuestCounts, type StayDates } from "@/components/booking/types";
import { Button } from "@/components/ui/Button";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { catalogForType, preferRate, rateLabel } from "@/lib/booking-catalog";
import { hotel } from "@/lib/content";
import { publicAvailabilityAction, publicCreateReservationAction } from "@pms-core/actions/booking";
import { formatLong, nightsBetween } from "@pms-core/lib/dates";
import type { AvailabilityOffer } from "@pms-core/types";

/**
 * Client component: tutto il percorso (passo corrente, date, ospiti, camera)
 * cambia mentre l'ospite clicca, quindi lo stato sta nel browser.
 *
 * I dati scendono verso i pezzi come props. I pezzi risalgono con onChange.
 * La ricerca e l'invio usano le server action già esistenti: il loro codice
 * resta sul server, da qui parte solo la chiamata.
 *
 * La pagina /booking è un Server Component. Se nell'indirizzo ci sono già
 * delle date valide, legge la disponibilità e ci passa initialOffers.
 */

const STEPS = [
  { id: "date", label: "Date" },
  { id: "ospiti", label: "Ospiti" },
  { id: "camere", label: "Camere" },
  { id: "riepilogo", label: "Riepilogo" },
  { id: "dati", label: "Dati" },
] as const;

type StepId = (typeof STEPS)[number]["id"];

const STEP_COPY: Record<StepId, { eyebrow: string; title: string; lede: string }> = {
  date: {
    eyebrow: "Soggiorno",
    title: "Quando arrivate",
    lede: "Scegliete il check-in e il check-out. Il check-out è il giorno in cui lasciate la camera.",
  },
  ospiti: {
    eyebrow: "Ospiti",
    title: "Quanti siete",
    lede: "Adulti e bambini. La disponibilità tiene conto di tutti.",
  },
  camere: {
    eyebrow: "Disponibilità",
    title: "Le camere libere",
    lede: "Scegliete la camera e la tariffa. Il prezzo è il totale del soggiorno.",
  },
  riepilogo: {
    eyebrow: "Riepilogo",
    title: "Il vostro soggiorno",
    lede: "Date, ospiti, camera e totale. Se qualcosa non torna, tornate indietro.",
  },
  dati: {
    eyebrow: "Recapiti",
    title: "Lasciate i dati",
    lede: "Vi confermiamo noi, per telefono o per lettera. Il pagamento si fa in locanda.",
  },
};

function stepIndex(id: StepId) {
  return STEPS.findIndex((item) => item.id === id);
}

export function BookingFlow({
  checkIn: initialIn = "",
  checkOut: initialOut = "",
  adults: initialAdults = 2,
  childCount: initialChildren = 0,
  initialOffers = [],
  initialSearched = false,
  initialError = null,
  initialDateAttempted = false,
}: {
  checkIn?: string;
  checkOut?: string;
  adults?: number;
  childCount?: number;
  initialOffers?: AvailabilityOffer[];
  initialSearched?: boolean;
  initialError?: string | null;
  initialDateAttempted?: boolean;
}) {
  const [checkIn, setCheckIn] = useState(initialIn);
  const [checkOut, setCheckOut] = useState(initialOut);
  const [adults, setAdults] = useState(initialAdults);
  const [childCount, setChildCount] = useState(initialChildren);
  const [offers, setOffers] = useState(initialOffers);
  const [searched, setSearched] = useState(initialSearched);
  const [roomTypeId, setRoomTypeId] = useState(initialOffers[0]?.roomTypeId ?? "");
  const [ratePlanId, setRatePlanId] = useState(preferRate(initialOffers[0]?.ratePlans ?? [])?.id ?? "");
  const [customer, setCustomer] = useState<CustomerDetails>(emptyCustomer);
  const [step, setStep] = useState<StepId>(initialSearched ? "camere" : "date");
  const [furthest, setFurthest] = useState(initialSearched ? stepIndex("camere") : 0);
  const [error, setError] = useState<string | null>(initialError);
  const [code, setCode] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [sending, setSending] = useState(false);
  const [dateAttempted, setDateAttempted] = useState(initialDateAttempted);
  const [dateTick, setDateTick] = useState(0);
  const [guestAttempted, setGuestAttempted] = useState(false);
  const [roomAttempted, setRoomAttempted] = useState(false);

  const headingRef = useRef<HTMLHeadingElement>(null);
  const dateFormRef = useRef<HTMLFormElement>(null);
  const skipFocus = useRef(true);
  const busy = useRef(false);

  const selected = useMemo(
    () => offers.find((offer) => offer.roomTypeId === roomTypeId),
    [offers, roomTypeId],
  );
  const rate = selected?.ratePlans.find((plan) => plan.id === ratePlanId);
  const catalog = selected ? catalogForType(selected.roomTypeName) : null;
  const roomName = catalog?.label;
  const planName = rate ? rateLabel(rate.name) : undefined;

  useEffect(() => {
    if (skipFocus.current) {
      skipFocus.current = false;
      return;
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    headingRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    headingRef.current?.focus();
  }, [step]);

  useEffect(() => {
    if (dateTick === 0) return;
    dateFormRef.current?.querySelector<HTMLElement>("[aria-invalid='true']")?.focus();
  }, [dateTick]);

  function changeDates(next: StayDates) {
    if (next.checkIn === checkIn && next.checkOut === checkOut) return;
    setCheckIn(next.checkIn);
    setCheckOut(next.checkOut);
    setOffers([]);
    setRoomTypeId("");
    setRatePlanId("");
    setSearched(false);
    setError(null);
    setFurthest(0);
  }

  function changeGuests(next: GuestCounts) {
    if (next.adults === adults && next.children === childCount) return;
    setAdults(next.adults);
    setChildCount(next.children);
    setOffers([]);
    setRoomTypeId("");
    setRatePlanId("");
    setSearched(false);
    setError(null);
    setFurthest((current) => Math.min(current, stepIndex("ospiti")));
  }

  function goTo(id: StepId) {
    if (stepIndex(id) > furthest) return;
    setStep(id);
  }

  function continueDates(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDateAttempted(true);
    if (validateStayDates({ checkIn, checkOut })) {
      setDateTick((value) => value + 1);
      return;
    }
    setFurthest((current) => Math.max(current, stepIndex("ospiti")));
    setStep("ospiti");
  }

  async function continueGuests(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setGuestAttempted(true);
    if (validateGuestCounts({ adults, children: childCount })) return;
    if (busy.current) return;
    busy.current = true;
    setError(null);
    setSearching(true);
    try {
      const result = await publicAvailabilityAction({
        checkIn,
        checkOut,
        adults,
        children: childCount,
      });
      setSearched(true);
      setRoomAttempted(false);
      if (!result.ok) {
        setOffers([]);
        setRoomTypeId("");
        setRatePlanId("");
        setError(result.error);
      } else {
        setOffers(result.data);
        const first = result.data[0];
        const preferred = first ? preferRate(first.ratePlans) : undefined;
        setRoomTypeId(first?.roomTypeId ?? "");
        setRatePlanId(preferred?.id ?? "");
      }
      setFurthest((current) => Math.max(current, stepIndex("camere")));
      setStep("camere");
    } finally {
      busy.current = false;
      setSearching(false);
    }
  }

  function continueRooms(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (offers.length === 0) {
      setStep("date");
      return;
    }
    setRoomAttempted(true);
    if (!selected || !rate) return;
    setFurthest((current) => Math.max(current, stepIndex("riepilogo")));
    setStep("riepilogo");
  }

  function continueSummary(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFurthest((current) => Math.max(current, stepIndex("dati")));
    setStep("dati");
  }

  async function send(details: CustomerDetails) {
    const roomId = selected?.availableRooms[0]?.id;
    if (!roomId || !rate) {
      setError("Questa tipologia non ha più camere su quelle date.");
      return;
    }
    if (busy.current) return;
    busy.current = true;
    setSending(true);
    setError(null);
    try {
      // TODO: il consenso privacy è controllato solo nel form, nel browser.
      // publicCreateReservationAction non ha un campo per salvarlo.
      // Le note e i bambini invece partono già con la prenotazione.
      // La camera assegnata è la prima libera di quel tipo, come prima:
      // l'ospite sceglie la tipologia, non il numero di camera.
      const result = await publicCreateReservationAction({
        roomId,
        checkIn,
        checkOut,
        adults,
        children: childCount,
        ratePlanId,
        notes: details.notes.trim() || undefined,
        guest: {
          firstName: details.firstName.trim(),
          lastName: details.lastName.trim(),
          email: details.email.trim(),
          phone: details.phone.trim(),
        },
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setCode(result.data.code ?? "");
    } finally {
      busy.current = false;
      setSending(false);
    }
  }

  if (code !== null) {
    return (
      <div className="mx-auto w-full max-w-5xl">
        <section className="px-1 py-2">
          <p className="eyebrow text-muted">Richiesta inviata</p>
          <h2 id="cerca-title" className="display-lg mt-4 max-w-[16ch]">
            Vi aspettiamo a Gimillan
          </h2>
          <p className="lede mt-5 max-w-[40ch]">
            {code ? `Codice ${code}. ` : ""}
            Vi confermiamo a {customer.email || "questa email"}. Dal {formatLong(checkIn)} al {formatLong(checkOut)}.{" "}
            {guestLabel(adults, childCount)}.
          </p>
          <div className="mt-8">
            <BookingSummary
              checkIn={checkIn}
              checkOut={checkOut}
              adults={adults}
              childCount={childCount}
              roomName={roomName}
              rateName={planName}
              total={rate?.total}
            />
          </div>
          <p className="mt-8 text-[0.875rem] text-muted">
            Per qualsiasi cosa, {hotel.phone} · {hotel.email}
          </p>
          <button
            type="button"
            className={`${bookingQuietButtonClass} mt-6`}
            onClick={() => {
              setCode(null);
              setCustomer(emptyCustomer);
              setStep("date");
              setFurthest(0);
              setOffers([]);
              setSearched(false);
            }}
          >
            Nuova richiesta
          </button>
        </section>
      </div>
    );
  }

  const copy = STEP_COPY[step];
  const guestError = guestAttempted ? validateGuestCounts({ adults, children: childCount }) : null;
  const roomError = roomAttempted && (!selected || !rate) ? "Scegliete una tariffa per continuare." : null;

  return (
    <div id="disponibilita" className="mx-auto w-full max-w-5xl scroll-mt-28">
      <BookingProgress step={step} furthest={furthest} onGo={goTo} />

      <div className="mt-8">
        <p className="eyebrow text-muted">{copy.eyebrow}</p>
        <h2 id="cerca-title" ref={headingRef} tabIndex={-1} className="display-md mt-2 scroll-mt-28 outline-none">
          {copy.title}
        </h2>
        <p className="lede mt-3 max-w-[46ch]">{copy.lede}</p>

        <div className="mt-6">
          {step === "date" ? (
            <form ref={dateFormRef} onSubmit={continueDates} noValidate>
              <div className={bookingPanelClass}>
                <DateSelection
                  checkIn={checkIn}
                  checkOut={checkOut}
                  showErrors={dateAttempted}
                  onChange={changeDates}
                />
              </div>
              <p className="mt-4 px-1 text-[0.75rem] text-muted">
                Check-in dalle 15 · check-out entro le 10 · pagamento in locanda
              </p>
              <StepActions submitLabel="Continua" />
            </form>
          ) : null}

          {step === "ospiti" ? (
            <form onSubmit={(event) => void continueGuests(event)} noValidate>
              <div className={bookingPanelClass}>
                <GuestCount adults={adults} childCount={childCount} onChange={changeGuests} error={guestError} />
              </div>
              <StepActions
                onBack={() => goTo("date")}
                submitLabel="Cerca le camere"
                pending={searching}
                pendingLabel="Cerchiamo…"
              />
            </form>
          ) : null}

          {step === "camere" ? (
            <form onSubmit={continueRooms}>
              {checkIn && checkOut ? (
                <p className="mb-4 text-[0.875rem] text-muted">
                  {nightLabel(checkIn, checkOut)} · dal {formatLong(checkIn)} al {formatLong(checkOut)}
                </p>
              ) : null}
              {error ? (
                <p role="alert" className="mb-4 rounded-[var(--radius-card)] bg-[rgb(138_59_59_/_0.08)] px-5 py-4 text-[0.875rem] text-[#8a3b3b]">
                  {error}
                </p>
              ) : null}
              {roomError ? (
                <p role="alert" className={`${bookingErrorClass} mb-4`}>
                  {roomError}
                </p>
              ) : null}
              {searched && offers.length === 0 && !error ? (
                <p className={`${bookingPanelClass} text-[0.95rem] leading-relaxed text-muted`}>
                  Quelle notti sono già prese. Provate altre date, o chiamate il{" "}
                  <a
                    href={hotel.phoneHref}
                    className="text-ink underline decoration-[rgb(37_39_33_/_0.25)] underline-offset-4"
                  >
                    {hotel.phone}
                  </a>
                  .
                </p>
              ) : null}
              {offers.length > 0 ? (
                <AvailableRooms
                  offers={offers}
                  nights={checkIn.length >= 10 && checkOut.length >= 10 ? Math.max(nightsBetween(checkIn, checkOut), 0) : 0}
                  roomTypeId={roomTypeId}
                  ratePlanId={ratePlanId}
                  onSelect={(nextType, nextRate) => {
                    setRoomTypeId(nextType);
                    setRatePlanId(nextRate);
                    setRoomAttempted(false);
                  }}
                />
              ) : null}
              <StepActions
                onBack={() => goTo("ospiti")}
                submitLabel={offers.length === 0 ? "Cambia le date" : "Continua"}
              />
            </form>
          ) : null}

          {step === "riepilogo" ? (
            <form onSubmit={continueSummary}>
              <BookingSummary
                labelledBy="cerca-title"
                checkIn={checkIn}
                checkOut={checkOut}
                adults={adults}
                childCount={childCount}
                roomName={roomName}
                rateName={planName}
                total={rate?.total}
              />
              <StepActions onBack={() => goTo("camere")} submitLabel="Vai ai dati" />
            </form>
          ) : null}

          {step === "dati" ? (
            <div className="grid gap-5">
              <BookingSummary
                checkIn={checkIn}
                checkOut={checkOut}
                adults={adults}
                childCount={childCount}
                roomName={roomName}
                rateName={planName}
                total={rate?.total}
              />
              <div className={bookingPanelClass}>
                <CustomerDetailsForm
                  value={customer}
                  onChange={setCustomer}
                  onSubmit={(details) => void send(details)}
                  onBack={() => goTo("riepilogo")}
                  pending={sending}
                  error={error}
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function BookingProgress({
  step,
  furthest,
  onGo,
}: {
  step: StepId;
  furthest: number;
  onGo: (id: StepId) => void;
}) {
  const current = stepIndex(step);

  return (
    <nav aria-label="Passi della prenotazione">
      <p className="text-[0.75rem] text-muted">
        Passo {current + 1} di {STEPS.length}
      </p>
      <ol className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {STEPS.map((item, index) => {
          const active = item.id === step;
          const enabled = index <= furthest;
          return (
            <li key={item.id} className="shrink-0">
              <button
                type="button"
                disabled={!enabled}
                aria-current={active ? "step" : undefined}
                onClick={() => onGo(item.id)}
                className={`inline-flex h-11 items-center gap-2 rounded-full px-3.5 text-[0.8125rem] transition-colors duration-300 ${
                  active
                    ? "bg-alpine text-surface"
                    : enabled
                      ? "border border-[rgb(37_39_33_/_0.08)] bg-surface text-ink hover:border-alpine/30"
                      : "cursor-not-allowed text-muted/70"
                }`}
              >
                <span
                  aria-hidden
                  className={`grid size-6 place-items-center rounded-full text-[0.75rem] ${
                    active ? "bg-surface/15" : "bg-surface-deep text-ink"
                  }`}
                >
                  {index + 1}
                </span>
                {item.label}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function StepActions({
  onBack,
  submitLabel,
  pending = false,
  pendingLabel = "Attendere…",
}: {
  onBack?: () => void;
  submitLabel: string;
  pending?: boolean;
  pendingLabel?: string;
}) {
  return (
    <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
      {onBack ? (
        <button type="button" onClick={onBack} className={bookingQuietButtonClass}>
          Indietro
        </button>
      ) : (
        <span className="hidden sm:block" />
      )}
      <MagneticButton className="w-full sm:w-auto">
        <Button type="submit" size="lg" disabled={pending} className="w-full disabled:opacity-60 sm:w-auto">
          {pending ? pendingLabel : submitLabel}
        </Button>
      </MagneticButton>
    </div>
  );
}
