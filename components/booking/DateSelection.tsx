"use client";

import { CalendarRange } from "lucide-react";
import { useId, useState } from "react";

import { addDaysISO } from "@pms-core/lib/dates";

import { nightLabel } from "@/components/booking/copy";
import { stayDateErrors, withCheckoutAfterCheckIn } from "@/components/booking/dates";
import { bookingErrorClass } from "@/components/booking/styles";
import type { StayDates } from "@/components/booking/types";
import { todayISO } from "@/lib/booking";

/**
 * Client component: i due campi cambiano mentre l'ospite li compila.
 * Le date scelte non stanno qui. Le tiene BookingFlow e le passa come props.
 * Quando l'ospite cambia un giorno, chiamiamo onChange con entrambe le date.
 */
export function DateSelection({
  checkIn,
  checkOut,
  onChange,
  showErrors = false,
}: {
  checkIn: string;
  checkOut: string;
  onChange: (dates: StayDates) => void;
  /** true dopo che l'ospite ha premuto Continua con date non valide. */
  showErrors?: boolean;
}) {
  const checkInId = useId();
  const checkOutId = useId();
  const checkInErrorId = useId();
  const checkOutErrorId = useId();
  const [touchedIn, setTouchedIn] = useState(false);
  const [touchedOut, setTouchedOut] = useState(false);

  const today = todayISO();
  const errors = stayDateErrors({ checkIn, checkOut }, today);
  const checkInError = showErrors || touchedIn ? errors.checkIn : undefined;
  const checkOutError = showErrors || touchedOut ? errors.checkOut : undefined;
  const nightsReady = !errors.checkIn && !errors.checkOut;

  return (
    <fieldset className="min-w-0">
      <legend className="sr-only">Date del soggiorno</legend>
      <div className="grid items-stretch gap-3 sm:grid-cols-[minmax(0,1fr)_8.5rem_minmax(0,1fr)]">
        <DateField
          id={checkInId}
          name="checkIn"
          errorId={checkInErrorId}
          label="Check-in"
          value={checkIn}
          min={today}
          error={checkInError}
          onBlur={() => setTouchedIn(true)}
          onChange={(value) => {
            onChange(withCheckoutAfterCheckIn({ checkIn: value, checkOut }));
          }}
        />
        <div className="grid place-items-center rounded-[var(--radius-soft)] bg-alpine px-3 py-4 text-center text-surface">
          <p className="text-[0.6875rem] tracking-[0.16em] text-surface/70 uppercase">Notti</p>
          <p className="mt-1 text-[1.05rem] leading-tight font-medium">
            {nightsReady ? nightLabel(checkIn, checkOut) : "Da definire"}
          </p>
        </div>
        <DateField
          id={checkOutId}
          name="checkOut"
          errorId={checkOutErrorId}
          label="Check-out"
          value={checkOut}
          min={checkIn ? addDaysISO(checkIn, 1) : today}
          error={checkOutError}
          onBlur={() => setTouchedOut(true)}
          onChange={(value) => onChange({ checkIn, checkOut: value })}
        />
      </div>
    </fieldset>
  );
}

function DateField({
  id,
  name,
  errorId,
  label,
  value,
  min,
  error,
  onChange,
  onBlur,
}: {
  id: string;
  name: string;
  errorId: string;
  label: string;
  value: string;
  min: string;
  error?: string;
  onChange: (value: string) => void;
  onBlur: () => void;
}) {
  return (
    <div className="flex h-full flex-col justify-center rounded-[var(--radius-soft)] bg-paper px-4 py-4 sm:px-5">
      <label htmlFor={id} className="flex items-center gap-2 text-[0.75rem] text-muted">
        <CalendarRange className="size-4 shrink-0" strokeWidth={1.5} aria-hidden />
        {label}
      </label>
      <span className="relative mt-1 block">
        <input
          id={id}
          name={name}
          type="date"
          required
          value={value}
          min={min}
          data-empty={value === ""}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          onBlur={onBlur}
          onChange={(event) => onChange(event.target.value)}
          className="date-field h-12 w-full bg-transparent text-base font-medium text-ink outline-none [color-scheme:light]"
        />
        <span aria-hidden className="date-hint">
          Seleziona data
        </span>
      </span>
      {error ? (
        <p id={errorId} className={bookingErrorClass}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
