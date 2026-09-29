"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { reservationStatusMeta } from "@pms-core/config/status";
import { StatusBadge } from "@pms-core/components/ui/badge";
import { formatLong } from "@pms-core/lib/dates";
import { formatMoney } from "@pms-core/lib/money";
import {
  planningFocusHref,
  RECENT_LIMIT,
  type RecentStay,
} from "@pms-core/lib/recent-stays";
import { guestDisplay } from "@pms-core/lib/utils";

export type { RecentStay };

const rowClass =
  "group -mx-2 flex w-[calc(100%+1rem)] cursor-pointer items-center justify-between gap-3 rounded-2xl px-2 py-1.5 text-left text-sm transition-colors hover:bg-[var(--pms-hover)] focus-visible:bg-[var(--pms-hover)]";

export function OccupancyWidget({
  occupancy,
  free,
  cleaning,
  recent,
  onSelectRecent,
}: {
  occupancy: number;
  free: number;
  cleaning: number;
  recent: RecentStay[];
  /** On Planning: focus the stay in place. Elsewhere rows link to Planning. */
  onSelectRecent?: (stay: RecentStay) => void;
}) {
  const pct = Math.round(occupancy * 100);
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="pms-card p-5">
        <p className="text-sm text-[var(--pms-muted)]">Occupazione</p>
        <div className="mt-4 flex items-center gap-5">
          <div
            className="grid size-24 place-items-center rounded-full"
            style={{ background: `conic-gradient(var(--pms-alpine) ${pct * 3.6}deg, var(--pms-surface-dark) 0)` }}
          >
            <span className="grid size-16 place-items-center rounded-full bg-[var(--pms-surface)] font-semibold tabular-nums tracking-[-0.02em] text-lg">
              {pct}%
            </span>
          </div>
          <ul className="space-y-1 text-sm">
            <li>{free} libere</li>
            <li>{cleaning} in pulizia</li>
          </ul>
        </div>
      </section>
      <section className="pms-card p-5">
        <p className="text-sm text-[var(--pms-muted)]">Prenotazioni recenti</p>
        <ul className="mt-2 space-y-1">
          {recent.slice(0, RECENT_LIMIT).map((item) => {
            const guest = guestDisplay(item.guest.firstName, item.guest.lastName);
            const body = (
              <>
                <span className="min-w-0">
                  <span className="block truncate font-medium">{guest}</span>
                  <span className="text-xs text-[var(--pms-muted)]">{formatLong(item.checkIn)}</span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <span>{formatMoney(item.total, item.currency)}</span>
                  <StatusBadge label={reservationStatusMeta[item.status].label} tone={reservationStatusMeta[item.status].tone} />
                  <ChevronRight
                    className="size-4 text-[var(--pms-muted)] opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                    aria-hidden
                  />
                </span>
              </>
            );
            return (
              <li key={item.id}>
                {onSelectRecent ? (
                  <button
                    type="button"
                    className={rowClass}
                    aria-label={`Apri ${guest} sul planning`}
                    onClick={() => onSelectRecent(item)}
                  >
                    {body}
                  </button>
                ) : (
                  <Link href={planningFocusHref(item)} className={rowClass} aria-label={`Apri ${guest} sul planning`}>
                    {body}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
