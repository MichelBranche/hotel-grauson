"use client";

import { useState } from "react";

import { hotel } from "@/lib/content";
import { publicPayAtPropertyAction, publicStartCardCheckoutAction } from "@pms-core/actions/booking";
import { formatRange } from "@pms-core/lib/dates";
import { formatMoneyExact } from "@pms-core/lib/money";

export function PaymentChoice({
  code,
  status,
  roomTypeName,
  checkIn,
  checkOut,
  total,
  depositAmount,
  depositPercent,
  paidOnline,
  payAtProperty,
}: {
  code: string;
  status: string;
  roomTypeName: string;
  checkIn: string;
  checkOut: string;
  total: number;
  depositAmount: number;
  depositPercent: number;
  paidOnline: boolean;
  payAtProperty: boolean;
}) {
  const [requested, setRequested] = useState(payAtProperty && status === "OPTION");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<"property" | "card" | null>(null);

  if (status === "CONFIRMED") {
    return (
      <section className="rounded-[var(--radius-panel)] border border-[rgb(37_39_33_/_0.06)] bg-surface px-6 py-10 shadow-[var(--shadow-soft)] sm:px-10 sm:py-14">
        <p className="eyebrow text-muted">Soggiorno confermato</p>
        <h1 className="display-lg mt-4 max-w-[16ch]">Vi aspettiamo a Gimillan</h1>
        <p className="lede mt-5 max-w-[36ch]">
          Codice {code}. {formatRange(checkIn, checkOut)}.
          {paidOnline
            ? " L'acconto con carta è stato registrato."
            : " Il pagamento si fa in locanda, alla reception."}
        </p>
        <p className="mt-8 text-[0.875rem] text-muted">
          Per qualsiasi cosa, {hotel.phone} · {hotel.email}
        </p>
      </section>
    );
  }

  if (requested) {
    return (
      <section className="rounded-[var(--radius-panel)] border border-[rgb(37_39_33_/_0.06)] bg-surface px-6 py-10 shadow-[var(--shadow-soft)] sm:px-10 sm:py-14">
        <p className="eyebrow text-muted">Richiesta inviata</p>
        <h1 className="display-lg mt-4 max-w-[16ch]">La locanda verifica</h1>
        <p className="lede mt-5 max-w-[40ch]">
          Codice {code}. {formatRange(checkIn, checkOut)}. Vi confermiamo il soggiorno se va bene. Il pagamento si fa in locanda, alla reception.
        </p>
        <p className="mt-8 text-[0.875rem] text-muted">
          Per qualsiasi cosa, {hotel.phone} · {hotel.email}
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-[var(--radius-panel)] border border-[rgb(37_39_33_/_0.06)] bg-surface px-6 py-10 shadow-[var(--shadow-soft)] sm:px-10 sm:py-14">
      <p className="eyebrow text-muted">Come pagare</p>
      <h1 className="display-lg mt-4 max-w-[16ch]">Scegliete il pagamento</h1>
      <dl className="mt-6 space-y-1 text-[0.9375rem] text-ink">
        <div>Codice {code}</div>
        <div>{formatRange(checkIn, checkOut)}</div>
        <div>{roomTypeName}</div>
        <div>Totale {formatMoneyExact(total)}</div>
      </dl>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-[var(--radius-card)] bg-paper p-5">
          <h2 className="font-[family-name:var(--font-sans)]! text-[1rem] leading-snug! font-medium! tracking-normal!">
            Paga in struttura
          </h2>
          <p className="mt-2 text-[0.875rem] leading-relaxed text-muted">
            La reception verifica la richiesta e conferma se va bene. Il pagamento si fa in locanda.
          </p>
          <button
            type="button"
            disabled={pending !== null}
            aria-busy={pending === "property" || undefined}
            className="mt-5 h-11 rounded-full bg-accent px-5 text-[0.8125rem] font-medium text-surface disabled:opacity-60"
            onClick={() => {
              setPending("property");
              setError(null);
              void publicPayAtPropertyAction(code).then((result) => {
                setPending(null);
                if (!result.ok) {
                  setError(result.error);
                  return;
                }
                setRequested(true);
              });
            }}
          >
            {pending === "property" ? "Invio…" : "Paga in struttura"}
          </button>
        </div>

        <div className="rounded-[var(--radius-card)] bg-paper p-5">
          <h2 className="font-[family-name:var(--font-sans)]! text-[1rem] leading-snug! font-medium! tracking-normal!">
            Paga online con carta
          </h2>
          <p className="mt-2 text-[0.875rem] leading-relaxed text-muted">
            {depositPercent < 100
              ? `Acconto ${formatMoneyExact(depositAmount)}. Il resto si salda in locanda.`
              : `Pagamento di ${formatMoneyExact(depositAmount)} con carta.`}
          </p>
          <button
            type="button"
            disabled={pending !== null}
            aria-busy={pending === "card" || undefined}
            className="mt-5 h-11 rounded-full border border-[rgb(37_39_33_/_0.12)] px-5 text-[0.8125rem] font-medium text-ink disabled:opacity-60"
            onClick={() => {
              setPending("card");
              setError(null);
              void publicStartCardCheckoutAction(code)
                .then((result) => {
                  if (!result.ok) {
                    setPending(null);
                    setError(result.error);
                    return;
                  }
                  window.location.assign(result.data.checkoutUrl);
                })
                .catch(() => {
                  setPending(null);
                  setError("Pagamento online non ancora disponibile");
                });
            }}
          >
            {pending === "card" ? "Apertura…" : "Paga online con carta"}
          </button>
        </div>
      </div>

      {error ? (
        <p role="alert" className="mt-6 rounded-[var(--radius-card)] bg-[rgb(138_59_59_/_0.08)] px-5 py-4 text-[0.875rem] text-[#8a3b3b]">
          {error}
        </p>
      ) : null}
    </section>
  );
}
