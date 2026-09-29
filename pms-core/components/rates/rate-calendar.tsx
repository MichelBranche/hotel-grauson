import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import { addDaysISO } from "@pms-core/lib/dates";
import type { NightInfo, PricingPlan } from "@pms-core/lib/pricing";
import { cn } from "@pms-core/lib/utils";

type CalendarData = {
  plan: PricingPlan;
  dates: string[];
  rows: { roomTypeId: string; roomTypeName: string; nights: NightInfo[] }[];
};

function cellTitle(night: NightInfo) {
  const parts = [
    night.price !== null ? `${night.price} €` : "Prezzo non impostato",
    night.season ? `Stagione: ${night.season}` : null,
    night.minStay > 1 ? `Minimo ${night.minStay} notti` : null,
    night.maxStay ? `Massimo ${night.maxStay} notti` : null,
    night.closed ? "Chiuso alla vendita" : null,
    night.closedToArrival ? "Nessun arrivo" : null,
    night.closedToDeparture ? "Nessuna partenza" : null,
  ];
  return parts.filter(Boolean).join(" · ");
}

export function RateCalendar({
  data,
  plans,
  from,
  days,
  today,
}: {
  data: CalendarData | null;
  plans: { id: string; name: string }[];
  from: string;
  days: number;
  today: string;
}) {
  const href = (next: { from?: string; plan?: string }) => {
    const plan = next.plan ?? data?.plan.id;
    return `/pms/rates?from=${next.from ?? from}${plan ? `&plan=${plan}` : ""}#calendario`;
  };

  return (
    <section id="calendario" className="scroll-mt-4 space-y-3" aria-labelledby="calendario-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="calendario-title" className="text-lg">
            Calendario prezzi
          </h2>
          <p className="text-sm text-[var(--pms-muted)]">
            Prezzo effettivo a notte, come lo calcolano planning e booking. Passa sul giorno per il dettaglio.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {plans.length > 1
            ? plans.map((plan) => (
                <Link
                  key={plan.id}
                  href={href({ plan: plan.id })}
                  scroll={false}
                  className={cn(
                    "pms-press rounded-full px-3 py-1.5 text-xs",
                    plan.id === data?.plan.id ? "bg-[var(--pms-alpine)] text-[var(--pms-surface)]" : "bg-white/70 hover:bg-[var(--pms-surface-dark)]",
                  )}
                >
                  {plan.name}
                </Link>
              ))
            : null}
          <div className="flex items-center gap-1 rounded-full bg-white/70 p-1">
            <Link
              href={href({ from: addDaysISO(from, -days) })}
              scroll={false}
              aria-label="Periodo precedente"
              className="pms-press grid size-8 place-items-center rounded-full hover:bg-[var(--pms-surface-dark)]"
            >
              <ChevronLeft className="size-4" />
            </Link>
            <Link href={href({ from: today })} scroll={false} className="pms-press rounded-full px-3 py-1.5 text-xs hover:bg-[var(--pms-surface-dark)]">
              Oggi
            </Link>
            <Link
              href={href({ from: addDaysISO(from, days) })}
              scroll={false}
              aria-label="Periodo successivo"
              className="pms-press grid size-8 place-items-center rounded-full hover:bg-[var(--pms-surface-dark)]"
            >
              <ChevronRight className="size-4" />
            </Link>
          </div>
        </div>
      </div>

      {!data ? (
        <p className="pms-card p-5 text-sm text-[var(--pms-muted)]">Crea un piano tariffario attivo per vedere il calendario.</p>
      ) : data.rows.length === 0 ? (
        <p className="pms-card p-5 text-sm text-[var(--pms-muted)]">Nessuna tipologia attiva.</p>
      ) : (
        <div className="pms-card overflow-x-auto pms-scroll p-0">
          <table className="w-full min-w-max border-collapse text-xs">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-[var(--pms-surface)] px-4 py-2 text-left font-normal text-[var(--pms-muted)]">
                  {data.plan.name}
                </th>
                {data.dates.map((date) => (
                  <th
                    key={date}
                    className={cn("w-14 px-1 py-2 text-center font-normal", date === today && "text-[var(--pms-alpine)]")}
                  >
                    <span className="block text-[10px] uppercase text-[var(--pms-muted)]">{format(parseISO(date), "EEEEEE", { locale: it })}</span>
                    <span className="block text-sm font-medium tabular-nums">{format(parseISO(date), "d")}</span>
                    {date.endsWith("-01") || date === data.dates[0] ? (
                      <span className="block text-[10px] text-[var(--pms-muted)]">{format(parseISO(date), "MMM", { locale: it })}</span>
                    ) : null}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row) => (
                <tr key={row.roomTypeId} className="border-t border-[var(--pms-line)]">
                  <th scope="row" className="sticky left-0 z-10 bg-[var(--pms-surface)] px-4 py-2 text-left text-sm font-medium whitespace-nowrap">
                    {row.roomTypeName}
                  </th>
                  {row.nights.map((night) => (
                    <td key={night.date} className="p-0.5" title={cellTitle(night)}>
                      <div
                        className={cn(
                          "relative flex h-12 flex-col items-center justify-center rounded-lg tabular-nums",
                          night.closed
                            ? "bg-[#f3dce3] text-[#6a3340]"
                            : night.season
                              ? "bg-[#efe6c9]/70"
                              : "bg-transparent",
                        )}
                      >
                        <span className="text-[13px] font-medium">
                          {night.closed ? "Chiuso" : night.price !== null ? Math.round(night.price) : "—"}
                        </span>
                        {night.minStay > 1 && !night.closed ? <span className="text-[10px] text-[var(--pms-muted)]">min {night.minStay}</span> : null}
                        {night.closedToArrival || night.closedToDeparture ? (
                          <span className="absolute top-1 right-1 flex gap-0.5">
                            {night.closedToArrival ? <span className="size-1.5 rounded-full bg-[#8a3b3b]" /> : null}
                            {night.closedToDeparture ? <span className="size-1.5 rounded-full bg-[#5c4a28]" /> : null}
                          </span>
                        ) : null}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex flex-wrap gap-x-5 gap-y-1 border-t border-[var(--pms-line)] px-4 py-3 text-[11px] text-[var(--pms-muted)]">
            <span className="flex items-center gap-1.5">
              <span className="size-3 rounded bg-[#efe6c9]" /> Stagione
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-3 rounded bg-[#f3dce3]" /> Chiuso alla vendita
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-[#8a3b3b]" /> Nessun arrivo
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-[#5c4a28]" /> Nessuna partenza
            </span>
            <span>Prezzi in €, arrotondati. min N = soggiorno minimo.</span>
          </div>
        </div>
      )}
    </section>
  );
}
