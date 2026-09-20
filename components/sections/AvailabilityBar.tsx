"use client";

import { ArrowRight, CalendarDays, CalendarRange, Users } from "lucide-react";
import { useId, useState } from "react";

import { MagneticButton } from "@/components/ui/MagneticButton";
import { Reveal } from "@/components/ui/Reveal";
import { buildBookingUrl, nextDayISO, todayISO } from "@/lib/booking";
import { hotel } from "@/lib/content";

const fieldShell =
  "flex min-w-0 flex-1 items-center gap-3 rounded-[var(--radius-soft)] px-3 py-2.5 transition-colors duration-400 [transition-timing-function:var(--ease-out)] hover:bg-[rgb(37_39_33_/_0.035)] focus-within:bg-[rgb(37_39_33_/_0.045)] md:rounded-full md:px-4";

export function AvailabilityBar({
  layout = "pinned",
  defaultGuests = 2,
}: {
  layout?: "pinned" | "inline";
  defaultGuests?: number;
}) {
  const checkInId = useId();
  const checkOutId = useId();
  const guestsId = useId();

  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(defaultGuests);
  const [fallback, setFallback] = useState(false); // kept for the rare case the booking route is unavailable

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const target = buildBookingUrl({ checkIn, checkOut, guests });
    if (target) {
      window.location.assign(target);
      return;
    }
    setFallback(true);
  };

  const bar = (
    <Reveal y={24} stagger={0.1}>
      <form
        data-reveal
        onSubmit={handleSubmit}
        className="rounded-[var(--radius-panel)] border border-[rgb(37_39_33_/_0.06)] bg-surface/95 p-4 shadow-[var(--shadow-lift)] backdrop-blur-sm sm:p-5"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-5">
          <div className="flex items-center gap-4 lg:w-[19rem] lg:shrink-0">
            <span
              aria-hidden
              className="grid size-11 shrink-0 place-items-center rounded-[14px] bg-surface-deep text-alpine"
            >
              <CalendarDays className="size-5" strokeWidth={1.5} />
            </span>
            <span>
              <h2 id="prenota-title" className="display-sm">
                Prenota
              </h2>
              <p className="mt-1 text-[0.75rem] leading-snug text-muted">
                Date e numero di ospiti, oppure chiamate.
              </p>
            </span>
          </div>

          <span aria-hidden className="hidden h-12 w-px shrink-0 bg-[rgb(37_39_33_/_0.09)] lg:block" />

          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-1 lg:flex-1">
            <div className={fieldShell}>
              <CalendarRange className="size-[17px] shrink-0 text-muted" strokeWidth={1.5} aria-hidden />
              <span className="flex min-w-0 flex-col">
                <label htmlFor={checkInId} className="text-[0.6875rem] text-muted">
                  Check-in
                </label>
                <span className="relative">
                  <input
                    id={checkInId}
                    type="date"
                    value={checkIn}
                    min={todayISO()}
                    data-empty={checkIn === ""}
                    onChange={(event) => {
                      setCheckIn(event.target.value);
                      if (checkOut && event.target.value && checkOut <= event.target.value) {
                        setCheckOut(nextDayISO(event.target.value));
                      }
                    }}
                    className="date-field w-full bg-transparent text-[0.8125rem] font-medium outline-none"
                  />
                  <span aria-hidden className="date-hint">
                    Seleziona data
                  </span>
                </span>
              </span>
            </div>

            <span aria-hidden className="hidden h-8 w-px shrink-0 bg-[rgb(37_39_33_/_0.07)] sm:block" />

            <div className={fieldShell}>
              <CalendarRange className="size-[17px] shrink-0 text-muted" strokeWidth={1.5} aria-hidden />
              <span className="flex min-w-0 flex-col">
                <label htmlFor={checkOutId} className="text-[0.6875rem] text-muted">
                  Check-out
                </label>
                <span className="relative">
                  <input
                    id={checkOutId}
                    type="date"
                    value={checkOut}
                    min={checkIn ? nextDayISO(checkIn) : todayISO()}
                    data-empty={checkOut === ""}
                    onChange={(event) => setCheckOut(event.target.value)}
                    className="date-field w-full bg-transparent text-[0.8125rem] font-medium outline-none"
                  />
                  <span aria-hidden className="date-hint">
                    Seleziona data
                  </span>
                </span>
              </span>
            </div>

            <span aria-hidden className="hidden h-8 w-px shrink-0 bg-[rgb(37_39_33_/_0.07)] sm:block" />

            <div className={`${fieldShell} sm:max-w-[9.5rem]`}>
              <Users className="size-[17px] shrink-0 text-muted" strokeWidth={1.5} aria-hidden />
              <span className="flex min-w-0 flex-col">
                <label htmlFor={guestsId} className="text-[0.6875rem] text-muted">
                  Ospiti
                </label>
                <select
                  id={guestsId}
                  value={guests}
                  onChange={(event) => setGuests(Number(event.target.value))}
                  className="-ml-0.5 w-full appearance-none bg-transparent text-[0.8125rem] font-medium outline-none"
                >
                  {[1, 2, 3, 4, 5, 6].map((count) => (
                    <option key={count} value={count}>
                      {count}
                    </option>
                  ))}
                </select>
              </span>
            </div>
          </div>

          <MagneticButton className="lg:shrink-0">
            <button
              type="submit"
              className="arrow-parent group flex h-[3.125rem] w-full items-center justify-center gap-2.5 rounded-full bg-accent px-6 text-[0.8125rem] font-medium text-surface shadow-[0_14px_30px_-20px_rgb(38_50_41_/_0.9)] transition-colors duration-500 [transition-timing-function:var(--ease-out)] hover:bg-accent-hover"
            >
              Verifica disponibilità
              <ArrowRight className="arrow-slide size-[15px]" strokeWidth={1.6} aria-hidden />
            </button>
          </MagneticButton>
        </div>

        <p
          role="status"
          aria-live="polite"
          className={`overflow-hidden text-[0.8125rem] text-muted transition-all duration-500 [transition-timing-function:var(--ease-out)] ${
            fallback ? "mt-4 max-h-24 opacity-100" : "mt-0 max-h-0 opacity-0"
          }`}
        >
          {fallback ? (
            <>
              Le prenotazioni online aprono a breve. Per ora scriveteci a{" "}
              <a
                href={`mailto:${hotel.email}`}
                className="text-ink underline decoration-[rgb(37_39_33_/_0.25)] underline-offset-4 hover:decoration-ink"
              >
                {hotel.email}
              </a>{" "}
              o chiamate il{" "}
              <a
                href={hotel.phoneHref}
                className="text-ink underline decoration-[rgb(37_39_33_/_0.25)] underline-offset-4 hover:decoration-ink"
              >
                {hotel.phone}
              </a>
              .
            </>
          ) : null}
        </p>
      </form>
    </Reveal>
  );

  return (
    <section id="prenota" aria-labelledby="prenota-title" className="shell relative z-20 mt-5 sm:mt-7">
      {layout === "pinned" ? (
        <div>
          {/* The bar enters low, by the treeline, rises with the page and then holds
              at the centre of the viewport while the valley keeps moving behind it.
              The spacer below is that travel — it has to be real height, since a
              sticky box is confined to its parent's content box — and the footer
              reclaims it with a matching negative margin. */}
          <div className="lg:sticky lg:top-[calc(50svh-3.25rem)]">{bar}</div>
          <div aria-hidden className="pointer-events-none h-[var(--bar-travel)]" />
        </div>
      ) : (
        bar
      )}
    </section>
  );
}
