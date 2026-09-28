import { formatLong } from "@pms-core/lib/dates";
import { formatMoney } from "@pms-core/lib/money";

import { guestLabel, nightLabel } from "@/components/booking/copy";
import { bookingPanelClass } from "@/components/booking/styles";

/**
 * Nessuna direttiva "use client": qui non c'è stato e non ci sono click.
 * Il pezzo mostra solo ciò che riceve (date, ospiti, camera, totale).
 * BookingFlow, che è client, lo importa e gli passa il soggiorno già scelto.
 * Next mette comunque questo file nel bundle del browser, perché un
 * client component lo importa, ma non servono hook.
 */
export function BookingSummary({
  checkIn,
  checkOut,
  adults,
  childCount,
  roomName,
  rateName,
  total,
  labelledBy,
  layout = "grid",
}: {
  checkIn: string;
  checkOut: string;
  adults: number;
  childCount: number;
  roomName?: string;
  rateName?: string;
  total?: number;
  labelledBy?: string;
  /** "ticket" è la colonna laterale: una riga per voce, totale in evidenza. */
  layout?: "grid" | "ticket";
}) {
  const ticket = layout === "ticket";

  return (
    <dl
      aria-labelledby={labelledBy}
      aria-label={labelledBy ? undefined : "Riepilogo del soggiorno"}
      className={ticket ? "flex flex-col gap-3.5" : `${bookingPanelClass} grid gap-5 sm:grid-cols-2`}
    >
      <Row label="Check-in" value={dayLabel(checkIn)} ticket={ticket} />
      <Row label="Check-out" value={dayLabel(checkOut)} ticket={ticket} />
      <Row label="Notti" value={nightLabel(checkIn, checkOut)} ticket={ticket} />
      <Row label="Ospiti" value={guestLabel(adults, childCount)} ticket={ticket} />
      <Row label="Camera" value={roomName || "Ancora da scegliere"} ticket={ticket} />
      <Row label="Tariffa" value={rateName || "Ancora da scegliere"} ticket={ticket} />
      <div className={ticket ? "mt-2 rounded-[var(--radius-soft)] bg-alpine px-4 py-4 text-surface" : "border-t border-[rgb(37_39_33_/_0.08)] pt-5 sm:col-span-2"}>
        <dt className={`text-[0.6875rem] tracking-[0.14em] uppercase ${ticket ? "text-surface/65" : "text-muted"}`}>
          Totale
        </dt>
        <dd className={`mt-1 ${ticket ? "text-[1.65rem] leading-none font-medium" : "display-md mt-2"}`}>
          {typeof total === "number" ? formatMoney(total) : "Da calcolare"}
        </dd>
        <p className={`mt-3 max-w-[36ch] text-[0.8125rem] leading-relaxed ${ticket ? "text-surface/75" : "text-muted"}`}>
          Pagamento in locanda. Non è un pagamento online.
        </p>
      </div>
    </dl>
  );
}

function dayLabel(iso: string) {
  if (iso.length < 10) return "Da scegliere";
  return formatLong(iso);
}

function Row({ label, value, ticket }: { label: string; value: string; ticket?: boolean }) {
  if (ticket) {
    return (
      <div className="flex items-baseline justify-between gap-4 border-b border-[rgb(37_39_33_/_0.08)] pb-3">
        <dt className="text-[0.6875rem] tracking-[0.14em] text-muted uppercase">{label}</dt>
        <dd className="text-right text-[0.9375rem] text-ink">{value}</dd>
      </div>
    );
  }

  return (
    <div>
      <dt className="text-[0.6875rem] tracking-[0.14em] text-muted uppercase">{label}</dt>
      <dd className="mt-1 text-[1rem] text-ink">{value}</dd>
    </div>
  );
}
