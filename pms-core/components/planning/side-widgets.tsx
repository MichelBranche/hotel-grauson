import { reservationStatusMeta } from "@pms-core/config/status";
import { StatusBadge } from "@pms-core/components/ui/badge";
import { formatLong, toISODate } from "@pms-core/lib/dates";
import { formatMoney } from "@pms-core/lib/money";
import { guestDisplay } from "@pms-core/lib/utils";

type Recent = {
  id: string;
  code: string;
  status: keyof typeof reservationStatusMeta;
  total: number;
  currency: string;
  checkIn: Date;
  guest: { firstName: string; lastName: string };
};

export function OccupancyWidget({
  occupancy,
  free,
  cleaning,
  recent,
}: {
  occupancy: number;
  free: number;
  cleaning: number;
  recent: Recent[];
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
            <span className="grid size-16 place-items-center rounded-full bg-[var(--pms-surface)] font-[family-name:var(--font-sora)] text-lg">
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
        <ul className="mt-3 space-y-3">
          {recent.slice(0, 4).map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 text-sm">
              <span>
                <span className="block font-medium">{guestDisplay(item.guest.firstName, item.guest.lastName)}</span>
                <span className="text-xs text-[var(--pms-muted)]">{formatLong(toISODate(item.checkIn))}</span>
              </span>
              <span className="flex items-center gap-2">
                <span>{formatMoney(item.total, item.currency)}</span>
                <StatusBadge label={reservationStatusMeta[item.status].label} tone={reservationStatusMeta[item.status].tone} />
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
