import Link from "next/link";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";

import { requirePermission } from "@pms-core/auth/guards";
import { propertyConfig } from "@pms-core/config/property";
import { prisma } from "@pms-core/database/client";
import { formatShort, todayInTimeZone, toISODate } from "@pms-core/lib/dates";
import { todayDesk, type TodayStay } from "@pms-core/lib/today-desk";
import { guestDisplay } from "@pms-core/lib/utils";
import { reservationService } from "@pms-core/services/reservation.service";

function dayLabel(iso: string) {
  const label = format(parseISO(iso), "EEEE d MMMM yyyy", { locale: it });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function StaySection({
  title,
  empty,
  rows,
  when,
  action,
}: {
  title: string;
  empty: string;
  rows: TodayStay[];
  when: (stay: TodayStay) => string;
  action?: { href: string; label: string };
}) {
  return (
    <section className="pms-card overflow-auto">
      <div className="flex items-baseline justify-between gap-3 px-4 pt-4">
        <h2 className="text-sm text-[var(--pms-muted)]">{title}</h2>
        {action ? (
          <Link href={action.href} className="text-xs underline-offset-2 hover:underline">
            {action.label}
          </Link>
        ) : null}
      </div>
      {rows.length === 0 ? (
        <p className="px-4 py-8 text-sm text-[var(--pms-muted)]">{empty}</p>
      ) : (
        <table className="mt-2 w-full min-w-[640px] text-left text-sm">
          <thead className="text-xs text-[var(--pms-muted)]">
            <tr>
              <th className="px-4 py-3">Codice</th>
              <th className="px-4 py-3">Ospite</th>
              <th className="px-4 py-3">Camera</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((stay) => (
              <tr key={stay.id} className="border-t border-[var(--pms-line)]">
                <td className="px-4 py-3">
                  <Link href={`/pms/reservations/${stay.id}`} className="underline-offset-2 hover:underline">
                    {stay.code}
                  </Link>
                </td>
                <td className="px-4 py-3">{stay.guestName}</td>
                <td className="px-4 py-3">{stay.roomNumber}</td>
                <td className="px-4 py-3">{when(stay)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export default async function OggiPage() {
  const session = await requirePermission("reservations.read");
  const [rows, property, webCount] = await Promise.all([
    reservationService.list(session.propertyId),
    prisma.property.findUnique({ where: { id: session.propertyId }, select: { timezone: true } }),
    reservationService.countWebRequests(session.propertyId),
  ]);
  const timeZone = property?.timezone || propertyConfig.timezone;
  const today = todayInTimeZone(timeZone);
  const stays: TodayStay[] = rows.map((row) => ({
    id: row.id,
    code: row.code,
    status: row.status,
    checkIn: toISODate(row.checkIn),
    checkOut: toISODate(row.checkOut),
    guestName: guestDisplay(row.guest.firstName, row.guest.lastName),
    roomNumber: row.room.number,
    source: row.source,
    notes: row.notes,
  }));
  const desk = todayDesk(stays, today);
  const counters = [
    { label: "Arrivi", value: desk.arrivals.length },
    { label: "Partenze", value: desk.departures.length },
    { label: "In casa", value: desk.inHouse.length },
    { label: "Richieste web", value: webCount },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl">Oggi</h1>
        <p className="mt-1 text-sm text-[var(--pms-muted)]">{dayLabel(today)}. Arrivi, partenze e ospiti in casa.</p>
      </div>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {counters.map((item) => (
          <div key={item.label} className="pms-card px-4 py-3">
            <dt className="text-xs text-[var(--pms-muted)]">{item.label}</dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums">{item.value}</dd>
          </div>
        ))}
      </dl>
      <StaySection
        title="Arrivi oggi"
        empty="Nessun arrivo oggi."
        rows={desk.arrivals}
        when={(stay) => `Partenza ${formatShort(stay.checkOut)}`}
      />
      <StaySection
        title="Partenze oggi"
        empty="Nessuna partenza oggi."
        rows={desk.departures}
        when={(stay) => `Arrivo ${formatShort(stay.checkIn)}`}
      />
      <StaySection
        title="In casa"
        empty="Nessun ospite in casa."
        rows={desk.inHouse}
        when={(stay) => `Partenza ${formatShort(stay.checkOut)}`}
      />
      <StaySection
        title="Richieste web"
        empty="Nessuna richiesta web in attesa."
        rows={desk.webRequests}
        when={(stay) => `${formatShort(stay.checkIn)} → ${formatShort(stay.checkOut)}`}
        action={{ href: "/pms/reservations?coda=web", label: "Vedi tutte le richieste" }}
      />
    </div>
  );
}
