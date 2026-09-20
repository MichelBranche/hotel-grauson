import { ArrowRight, CalendarDays, CalendarRange, Users } from "lucide-react";

import { MagneticButton } from "@/components/ui/MagneticButton";
import { nextDayISO, todayISO } from "@/lib/booking";
import { hotel } from "@/lib/content";

const fieldShell =
  "flex min-w-0 flex-1 items-center gap-3 rounded-[var(--radius-soft)] px-3 py-2.5 transition-colors duration-400 [transition-timing-function:var(--ease-out)] hover:bg-[rgb(37_39_33_/_0.035)] focus-within:bg-[rgb(37_39_33_/_0.045)] md:rounded-full md:px-4";

export function BookingSearch({
  checkIn,
  checkOut,
  adults,
  pending,
  onCheckIn,
  onCheckOut,
  onAdults,
  onSubmit,
}: {
  checkIn: string;
  checkOut: string;
  adults: number;
  pending: boolean;
  onCheckIn: (value: string) => void;
  onCheckOut: (value: string) => void;
  onAdults: (value: number) => void;
  onSubmit: () => void;
}) {
  return (
    <form
      id="cerca"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
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
            <h2 id="cerca-title" className="display-sm">
              Le vostre notti
            </h2>
            <p className="mt-1 text-[0.75rem] leading-snug text-muted">
              Date e ospiti, oppure{" "}
              <a href={hotel.phoneHref} className="text-ink underline decoration-[rgb(37_39_33_/_0.25)] underline-offset-4">
                {hotel.phone}
              </a>
              .
            </p>
          </span>
        </div>

        <span aria-hidden className="hidden h-12 w-px shrink-0 bg-[rgb(37_39_33_/_0.09)] lg:block" />

        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-1 lg:flex-1">
          <div className={fieldShell}>
            <CalendarRange className="size-[17px] shrink-0 text-muted" strokeWidth={1.5} aria-hidden />
            <span className="flex min-w-0 flex-col">
              <label htmlFor="booking-check-in" className="text-[0.6875rem] text-muted">
                Check-in
              </label>
              <span className="relative">
                <input
                  id="booking-check-in"
                  type="date"
                  required
                  value={checkIn}
                  min={todayISO()}
                  data-empty={checkIn === ""}
                  onChange={(event) => {
                    const value = event.target.value;
                    onCheckIn(value);
                    if (checkOut && value && checkOut <= value) onCheckOut(nextDayISO(value));
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
              <label htmlFor="booking-check-out" className="text-[0.6875rem] text-muted">
                Check-out
              </label>
              <span className="relative">
                <input
                  id="booking-check-out"
                  type="date"
                  required
                  value={checkOut}
                  min={checkIn ? nextDayISO(checkIn) : todayISO()}
                  data-empty={checkOut === ""}
                  onChange={(event) => onCheckOut(event.target.value)}
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
              <label htmlFor="booking-adults" className="text-[0.6875rem] text-muted">
                Ospiti
              </label>
              <select
                id="booking-adults"
                value={adults}
                onChange={(event) => onAdults(Number(event.target.value))}
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
            disabled={pending}
            className="arrow-parent group flex h-[3.125rem] w-full items-center justify-center gap-2.5 rounded-full bg-accent px-6 text-[0.8125rem] font-medium text-surface shadow-[0_14px_30px_-20px_rgb(38_50_41_/_0.9)] transition-colors duration-500 [transition-timing-function:var(--ease-out)] hover:bg-accent-hover disabled:opacity-60"
          >
            {pending ? "Cerchiamo…" : "Verifica disponibilità"}
            <ArrowRight className="arrow-slide size-[15px]" strokeWidth={1.6} aria-hidden />
          </button>
        </MagneticButton>
      </div>
    </form>
  );
}
