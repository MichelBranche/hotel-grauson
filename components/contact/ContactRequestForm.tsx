"use client";

import Link from "next/link";
import { useState } from "react";

import { submitContactRequestAction } from "@/app/contatti/actions";
import { readContactRequest } from "@/lib/contact-request";

const fieldClass =
  "mt-1.5 h-11 w-full rounded-[16px] border border-[rgb(37_39_33_/_0.08)] bg-paper/70 px-3 text-[0.875rem] text-ink outline-none focus:border-alpine/40";

const empty = { firstName: "", lastName: "", email: "", phone: "", checkIn: "", checkOut: "", message: "" };

export function ContactRequestForm() {
  const [guest, setGuest] = useState(empty);
  const [company, setCompany] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <div
        role="status"
        className="flex h-full flex-col justify-center rounded-[var(--radius-panel)] border border-[rgb(37_39_33_/_0.06)] bg-surface px-6 py-10 shadow-[var(--shadow-soft)] sm:px-8 sm:py-12"
      >
        <p className="eyebrow text-muted">Richiesta inviata</p>
        <h3 className="display-md mt-3 max-w-[14ch]">Vi rispondiamo noi</h3>
        <p className="mt-4 max-w-[36ch] text-[0.875rem] leading-relaxed text-muted">
          Il messaggio è arrivato. Non è una prenotazione e non c’è un pagamento. Per chiedere una camera con le date già scelte,{" "}
          <Link href="/booking" className="text-ink underline decoration-[rgb(37_39_33_/_0.25)] underline-offset-4">
            Le vostre notti
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <form
      noValidate
      className="h-full rounded-[var(--radius-panel)] border border-[rgb(37_39_33_/_0.06)] bg-surface px-6 py-10 shadow-[var(--shadow-soft)] sm:px-8 sm:py-12"
      onSubmit={async (event) => {
        event.preventDefault();
        const parsed = readContactRequest(guest);
        if (!parsed.ok) {
          setError(parsed.error);
          return;
        }
        setSending(true);
        setError(null);
        try {
          const result = await submitContactRequestAction({ ...parsed.data, company });
          if (!result.ok) {
            setError(result.error);
            return;
          }
          setSent(true);
        } catch {
          setError("La richiesta non è partita. Riprovate, o chiamate la locanda.");
        } finally {
          setSending(false);
        }
      }}
    >
      <p className="eyebrow text-muted">Scriveteci</p>
      <h3 className="display-md mt-3 max-w-[16ch]">Una domanda, non una prenotazione</h3>
      <p className="mt-3 max-w-[42ch] text-[0.875rem] leading-relaxed text-muted">
        Chiedete informazioni o una disponibilità. Non si paga qui e la camera non è confermata. Se le date sono già scelte, potete anche usare{" "}
        <Link href="/booking" className="text-ink underline decoration-[rgb(37_39_33_/_0.25)] underline-offset-4">
          Le vostre notti
        </Link>
        .
      </p>

      <div className="h-0 overflow-hidden" aria-hidden="true">
        <label>
          Azienda
          <input
            tabIndex={-1}
            autoComplete="off"
            value={company}
            onChange={(event) => setCompany(event.target.value)}
          />
        </label>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <label className="text-[0.75rem] text-muted">
          Nome *
          <input
            required
            aria-required="true"
            autoComplete="given-name"
            value={guest.firstName}
            onChange={(event) => setGuest({ ...guest, firstName: event.target.value })}
            className={fieldClass}
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
            className={fieldClass}
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
            className={fieldClass}
          />
        </label>
        <label className="text-[0.75rem] text-muted">
          Telefono
          <input
            type="tel"
            autoComplete="tel"
            value={guest.phone}
            onChange={(event) => setGuest({ ...guest, phone: event.target.value })}
            className={fieldClass}
          />
        </label>
        <label className="text-[0.75rem] text-muted">
          Check-in
          <input
            type="date"
            value={guest.checkIn}
            onChange={(event) => setGuest({ ...guest, checkIn: event.target.value })}
            className={fieldClass}
          />
        </label>
        <label className="text-[0.75rem] text-muted">
          Check-out
          <input
            type="date"
            value={guest.checkOut}
            onChange={(event) => setGuest({ ...guest, checkOut: event.target.value })}
            className={fieldClass}
          />
        </label>
        <label className="text-[0.75rem] text-muted sm:col-span-2">
          Messaggio *
          <textarea
            required
            aria-required="true"
            rows={4}
            value={guest.message}
            onChange={(event) => setGuest({ ...guest, message: event.target.value })}
            className="mt-1.5 w-full resize-y rounded-[16px] border border-[rgb(37_39_33_/_0.08)] bg-paper/70 px-3 py-2.5 text-[0.875rem] leading-relaxed text-ink outline-none focus:border-alpine/40"
          />
        </label>
      </div>

      {error ? (
        <p role="alert" className="mt-6 rounded-[var(--radius-card)] bg-[rgb(138_59_59_/_0.08)] px-5 py-4 text-[0.875rem] text-[#8a3b3b]">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={sending}
        aria-busy={sending || undefined}
        className="mt-7 h-[3.125rem] rounded-full bg-accent px-7 text-[0.8125rem] font-medium text-surface transition-colors duration-500 hover:bg-accent-hover disabled:opacity-60"
      >
        {sending ? "Invio…" : "Invia la richiesta"}
      </button>
    </form>
  );
}
