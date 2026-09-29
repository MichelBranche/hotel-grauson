"use client";

import { useId, useState, type FormEvent } from "react";

import { customerErrors, firstCustomerError, NOTES_MAX, type CustomerField } from "@/components/booking/customer";
import {
  bookingErrorClass,
  bookingInputClass,
  bookingInputIdle,
  bookingInputInvalid,
  bookingQuietButtonClass,
} from "@/components/booking/styles";
import { Button } from "@/components/ui/Button";
import { MagneticButton } from "@/components/ui/MagneticButton";
import type { CustomerDetails } from "@/components/booking/types";

/**
 * Client component: la validazione (nome, email, telefono, consenso)
 * deve rispondere subito, mentre l'ospite compila, senza un giro sul server.
 * I valori stanno in BookingFlow. Qui li mostriamo e, se sono a posto,
 * li rimandiamo su con onSubmit. L'invio vero lo fa il flusso.
 *
 * noValidate: i messaggi del browser sarebbero nella lingua del computer.
 * Mostriamo noi i testi in italiano, dopo che il campo è stato lasciato
 * o dopo il tentativo di invio. Mentre si scrive, un errore già visibile
 * si aggiorna e sparisce appena il valore torna valido.
 */
export function CustomerDetailsForm({
  value,
  onChange,
  onSubmit,
  onBack,
  pending = false,
  error,
}: {
  value: CustomerDetails;
  onChange: (next: CustomerDetails) => void;
  onSubmit: (value: CustomerDetails) => void;
  onBack?: () => void;
  pending?: boolean;
  error?: string | null;
}) {
  const baseId = useId();
  const summaryId = useId();
  const [submitted, setSubmitted] = useState(false);
  const [touched, setTouched] = useState<Partial<Record<CustomerField, boolean>>>({});

  const errors = customerErrors(value);

  function visibleError(field: CustomerField) {
    if (!submitted && !touched[field]) return undefined;
    return errors[field];
  }

  function update(partial: Partial<CustomerDetails>) {
    onChange({ ...value, ...partial });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    const next = customerErrors(value);
    const first = firstCustomerError(next);
    if (first) {
      document.getElementById(fieldId(baseId, first))?.focus();
      return;
    }
    onSubmit(value);
  }

  const formError = submitted ? firstCustomerError(errors) : null;

  return (
    <form onSubmit={handleSubmit} noValidate aria-busy={pending || undefined} className="min-w-0">
      <p className="text-[0.75rem] text-muted">I campi con asterisco sono obbligatori.</p>

      {formError ? (
        <p id={summaryId} role="alert" className={`${bookingErrorClass} mt-4`}>
          Controllate i campi evidenziati prima di inviare.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className={`${bookingErrorClass} mt-4`}>
          {error}
        </p>
      ) : null}

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <TextField
          id={fieldId(baseId, "firstName")}
          name="firstName"
          autoComplete="given-name"
          label="Nome"
          required
          value={value.firstName}
          error={visibleError("firstName")}
          enterKeyHint="next"
          onBlur={() => setTouched((current) => ({ ...current, firstName: true }))}
          onChange={(next) => update({ firstName: next })}
        />
        <TextField
          id={fieldId(baseId, "lastName")}
          name="lastName"
          autoComplete="family-name"
          label="Cognome"
          required
          value={value.lastName}
          error={visibleError("lastName")}
          enterKeyHint="next"
          onBlur={() => setTouched((current) => ({ ...current, lastName: true }))}
          onChange={(next) => update({ lastName: next })}
        />
        <TextField
          id={fieldId(baseId, "email")}
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          label="Email"
          required
          value={value.email}
          error={visibleError("email")}
          enterKeyHint="next"
          onBlur={() => setTouched((current) => ({ ...current, email: true }))}
          onChange={(next) => update({ email: next })}
        />
        <TextField
          id={fieldId(baseId, "phone")}
          name="phone"
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          label="Telefono"
          required
          value={value.phone}
          error={visibleError("phone")}
          enterKeyHint="next"
          onBlur={() => setTouched((current) => ({ ...current, phone: true }))}
          onChange={(next) => update({ phone: next })}
        />
        <div className="sm:col-span-2">
          <TextField
            id={fieldId(baseId, "notes")}
            name="notes"
            label="Note"
            hint="Allergie, orario di arrivo, culla. Facoltativo."
            value={value.notes}
            error={visibleError("notes")}
            maxLength={NOTES_MAX}
            multiline
            onBlur={() => setTouched((current) => ({ ...current, notes: true }))}
            onChange={(next) => update({ notes: next })}
          />
        </div>
      </div>

      <PrivacyField
        id={fieldId(baseId, "privacyAccepted")}
        checked={value.privacyAccepted}
        error={visibleError("privacyAccepted")}
        onBlur={() => setTouched((current) => ({ ...current, privacyAccepted: true }))}
        onChange={(privacyAccepted) => update({ privacyAccepted })}
      />

      <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        {onBack ? (
          <button type="button" onClick={onBack} className={bookingQuietButtonClass}>
            Indietro
          </button>
        ) : (
          <span />
        )}
        <MagneticButton className="w-full sm:w-auto">
          <Button type="submit" size="lg" disabled={pending} className="w-full disabled:opacity-60 sm:w-auto">
            {pending ? "Invio…" : "Invia la richiesta"}
          </Button>
        </MagneticButton>
      </div>
    </form>
  );
}

function fieldId(baseId: string, field: CustomerField) {
  return `${baseId}-${field}`;
}

function TextField({
  id,
  name,
  label,
  value,
  onChange,
  onBlur,
  error,
  required,
  hint,
  type = "text",
  autoComplete,
  inputMode,
  enterKeyHint,
  maxLength,
  multiline = false,
}: {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  error?: string;
  required?: boolean;
  hint?: string;
  type?: string;
  autoComplete?: string;
  inputMode?: "email" | "tel" | "text";
  enterKeyHint?: "next" | "done";
  maxLength?: number;
  multiline?: boolean;
}) {
  const errorId = `${id}-error`;
  const hintId = hint ? `${id}-hint` : undefined;
  const describedBy = [hintId, error ? errorId : undefined].filter(Boolean).join(" ") || undefined;
  const border = error ? bookingInputInvalid : bookingInputIdle;
  const shared = {
    id,
    name,
    value,
    required,
    maxLength,
    autoComplete,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy,
    onBlur,
    onChange: (event: { target: { value: string } }) => onChange(event.target.value),
    className: `${bookingInputClass} ${border}`,
  };

  return (
    <div>
      <label htmlFor={id} className="text-[0.75rem] text-muted">
        {label}
        {required ? (
          <>
            <span aria-hidden> *</span>
            <span className="sr-only"> (obbligatorio)</span>
          </>
        ) : null}
      </label>
      {hint ? (
        <p id={hintId} className="mt-1 text-[0.75rem] leading-snug text-muted">
          {hint}
        </p>
      ) : null}
      {multiline ? (
        <textarea {...shared} rows={4} className={`${shared.className} h-auto py-3`} />
      ) : (
        <input {...shared} type={type} inputMode={inputMode} enterKeyHint={enterKeyHint} />
      )}
      {error ? (
        <p id={errorId} className={bookingErrorClass}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

function PrivacyField({
  id,
  checked,
  error,
  onChange,
  onBlur,
}: {
  id: string;
  checked: boolean;
  error?: string;
  onChange: (checked: boolean) => void;
  onBlur: () => void;
}) {
  const errorId = `${id}-error`;

  return (
    <div className="mt-6 rounded-[var(--radius-soft)] bg-surface-deep/40 px-4 py-4">
      <div className="flex items-start gap-3">
        <input
          id={id}
          name="privacy"
          type="checkbox"
          checked={checked}
          required
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          onBlur={onBlur}
          onChange={(event) => onChange(event.target.checked)}
          className="mt-1 size-6 shrink-0 accent-alpine"
        />
        <div className="text-[0.9375rem] leading-relaxed text-ink">
          <label htmlFor={id}>
            Acconsento al trattamento dei dati per gestire questa richiesta.
            <span aria-hidden> *</span>
            <span className="sr-only"> Campo obbligatorio.</span>
          </label>
          <a
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex min-h-11 items-center underline decoration-[rgb(37_39_33_/_0.25)] underline-offset-4 hover:decoration-ink"
          >
            Leggi l&apos;informativa privacy
            <span className="sr-only"> (si apre in un&apos;altra scheda)</span>
          </a>
        </div>
      </div>
      {error ? (
        <p id={errorId} className={bookingErrorClass}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
