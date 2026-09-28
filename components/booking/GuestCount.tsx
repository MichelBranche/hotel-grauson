"use client";

import { Minus, Plus } from "lucide-react";
import { useId } from "react";

import { bookingErrorClass } from "@/components/booking/styles";
import { ADULT_LIMITS, CHILD_LIMITS, type GuestCounts } from "@/components/booking/types";
import { propertyConfig } from "@pms-core/config/property";

/**
 * Client component: i pulsanti + e − aggiornano il numero nel browser.
 * Come per le date, il conteggio vive in BookingFlow.
 * Gli adulti restano tra 1 e 6, come il vecchio menu Ospiti.
 * I bambini arrivano fino a 6, il massimo già accettato dalla ricerca disponibilità.
 */
export function validateGuestCounts(guests: GuestCounts): string | null {
  if (!Number.isInteger(guests.adults) || guests.adults < ADULT_LIMITS.min || guests.adults > ADULT_LIMITS.max) {
    return "Indicate almeno un adulto, fino a sei.";
  }
  if (
    !Number.isInteger(guests.children) ||
    guests.children < CHILD_LIMITS.min ||
    guests.children > CHILD_LIMITS.max
  ) {
    return "I bambini possono essere da zero a sei.";
  }
  return null;
}

export function GuestCount({
  adults,
  childCount,
  onChange,
  error,
}: {
  adults: number;
  childCount: number;
  onChange: (guests: GuestCounts) => void;
  error?: string | null;
}) {
  const errorId = useId();

  return (
    <fieldset className="min-w-0" aria-describedby={error ? errorId : undefined}>
      <legend className="sr-only">Numero di ospiti</legend>
      <div className="divide-y divide-[rgb(37_39_33_/_0.08)]">
        <Counter
          label="Adulti"
          hint="Almeno una persona adulta"
          value={adults}
          min={ADULT_LIMITS.min}
          max={ADULT_LIMITS.max}
          decreaseLabel="Diminuisci gli adulti"
          increaseLabel="Aumenta gli adulti"
          onChange={(next) => onChange({ adults: next, children: childCount })}
        />
        <Counter
          label="Bambini"
          hint={`Fino a ${propertyConfig.settings.childrenMaxAge} anni`}
          value={childCount}
          min={CHILD_LIMITS.min}
          max={CHILD_LIMITS.max}
          decreaseLabel="Diminuisci i bambini"
          increaseLabel="Aumenta i bambini"
          onChange={(next) => onChange({ adults, children: next })}
        />
      </div>
      {error ? (
        <p id={errorId} role="alert" className={bookingErrorClass}>
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}

function Counter({
  label,
  hint,
  value,
  min,
  max,
  decreaseLabel,
  increaseLabel,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  decreaseLabel: string;
  increaseLabel: string;
  onChange: (value: number) => void;
}) {
  const labelId = useId();

  return (
    <div className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
      <div>
        <p id={labelId} className="text-[0.9375rem] text-ink">
          {label}
        </p>
        <p className="mt-1 text-[0.75rem] text-muted">{hint}</p>
      </div>
      <div className="flex items-center gap-2" role="group" aria-labelledby={labelId}>
        <button
          type="button"
          className="grid size-12 place-items-center rounded-full border border-[rgb(37_39_33_/_0.12)] text-ink transition-colors duration-300 hover:border-[rgb(37_39_33_/_0.3)] disabled:cursor-not-allowed disabled:opacity-35"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          aria-label={decreaseLabel}
        >
          <Minus className="size-4" strokeWidth={1.6} aria-hidden />
        </button>
        <span className="w-8 text-center text-base font-medium tabular-nums" aria-hidden>
          {value}
        </span>
        <span className="sr-only" aria-live="polite">
          {label}: {value}
        </span>
        <button
          type="button"
          className="grid size-12 place-items-center rounded-full border border-[rgb(37_39_33_/_0.12)] text-ink transition-colors duration-300 hover:border-[rgb(37_39_33_/_0.3)] disabled:cursor-not-allowed disabled:opacity-35"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          aria-label={increaseLabel}
        >
          <Plus className="size-4" strokeWidth={1.6} aria-hidden />
        </button>
      </div>
    </div>
  );
}
