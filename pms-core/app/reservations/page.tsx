import Link from "next/link";

import { requirePermission } from "@pms-core/auth/guards";
import { reservationStatusMeta } from "@pms-core/config/status";
import { propertyConfig } from "@pms-core/config/property";
import { StatusBadge } from "@pms-core/components/ui/badge";
import { Button } from "@pms-core/components/ui/button";
import { DatePicker } from "@pms-core/components/ui/date-picker";
import { Field } from "@pms-core/components/ui/input";
import { prisma } from "@pms-core/database/client";
import { isPayAtPropertyRequest } from "@pms-core/lib/pay-at-property";
import { optionExpiryLabel } from "@pms-core/lib/option-hold";
import {
  LIST_STATUSES,
  checkInInRange,
  parseReservationListQuery,
  reservationListEmpty,
  reservationListHref,
  type ReservationListQuery,
} from "@pms-core/lib/reservation-list";
import { reservationService } from "@pms-core/services/reservation.service";
import { toISODate } from "@pms-core/lib/dates";
import { formatMoney } from "@pms-core/lib/money";
import { cn, guestDisplay } from "@pms-core/lib/utils";

function chipClass(active: boolean) {
  return cn(
    "rounded-full px-3 py-1",
    active ? "bg-[var(--pms-alpine)] text-[var(--pms-surface)]" : "text-[var(--pms-muted)] hover:bg-[var(--pms-surface-dark)]",
  );
}

export default async function ReservationsPage({
  searchParams,
}: {
  searchParams: Promise<{ room?: string; coda?: string; stato?: string; from?: string; to?: string }>;
}) {
  const session = await requirePermission("reservations.read");
  const query = parseReservationListQuery(await searchParams);
  const { room, queue, status, from, to } = query;
  const filtered = Boolean(room || status || from || to);
  const [rows, property] = await Promise.all([
    reservationService.list(session.propertyId),
    prisma.property.findUnique({ where: { id: session.propertyId }, select: { timezone: true } }),
  ]);
  const timeZone = property?.timezone || propertyConfig.timezone;
  const inRoom = rows.filter((item) => (room ? item.room.number === room : true));
  const webRequests = inRoom.filter((item) => isPayAtPropertyRequest(item));
  const webInProperty = rows.filter((item) => isPayAtPropertyRequest(item)).length;
  const reservations = (queue ? webRequests : inRoom).filter((item) => {
    if (status && item.status !== status) return false;
    return checkInInRange(toISODate(item.checkIn), from, to);
  });
  const empty = reservationListEmpty({
    queue,
    total: rows.length,
    web: webInProperty,
    shown: reservations.length,
    filtered,
  });
  const href = (patch: Partial<ReservationListQuery>) => reservationListHref({ ...query, ...patch });

  return (
    <div>
      <h1 className="text-2xl">{queue ? "Richieste web" : "Prenotazioni"}</h1>
      <p className="mt-1 text-sm text-[var(--pms-muted)]">
        {room ? `Solo camera ${room}. ` : null}
        {queue
          ? "Soggiorni dal sito in attesa di conferma. Il pagamento si fa in reception."
          : "Tutte le prenotazioni. Filtra per stato o per data di arrivo."}
      </p>
      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        <Link href={href({ queue: false })} className={chipClass(!queue)} aria-current={queue ? undefined : "page"}>
          Tutte
        </Link>
        <Link href={href({ queue: true })} className={chipClass(queue)} aria-current={queue ? "page" : undefined}>
          Richieste web{webRequests.length ? ` · ${webRequests.length}` : ""}
        </Link>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-sm">
        <Link href={href({ status: undefined })} className={chipClass(!status)} aria-current={status ? undefined : "page"}>
          Tutti gli stati
        </Link>
        {LIST_STATUSES.map((item) => (
          <Link
            key={item}
            href={href({ status: item })}
            className={chipClass(status === item)}
            aria-current={status === item ? "page" : undefined}
          >
            {reservationStatusMeta[item].label}
          </Link>
        ))}
      </div>
      <form method="get" className="mt-4 flex flex-wrap items-end gap-3">
        {room ? <input type="hidden" name="room" value={room} /> : null}
        {queue ? <input type="hidden" name="coda" value="web" /> : null}
        {status ? <input type="hidden" name="stato" value={status} /> : null}
        <div className="w-44">
          <Field label="Arrivo dal">
            <DatePicker name="from" defaultValue={from ?? ""} clearable placeholder="Dal" aria-label="Arrivo dal" rangeStart={from} rangeEnd={to} />
          </Field>
        </div>
        <div className="w-44">
          <Field label="Arrivo al">
            <DatePicker name="to" defaultValue={to ?? ""} clearable placeholder="Al" aria-label="Arrivo al" rangeStart={from} rangeEnd={to} />
          </Field>
        </div>
        <Button type="submit">Applica</Button>
        {from || to ? (
          <Link href={href({ from: undefined, to: undefined })} className="pb-2 text-sm text-[var(--pms-muted)] underline-offset-2 hover:underline">
            Azzera date
          </Link>
        ) : null}
      </form>
      {empty ? (
        <div className="pms-card mt-5 px-4 py-8 text-sm text-[var(--pms-muted)]">{empty}</div>
      ) : (
      <div className="pms-card mt-5 overflow-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="text-xs text-[var(--pms-muted)]">
            <tr>
              <th className="px-4 py-3">Codice</th>
              <th className="px-4 py-3">Ospite</th>
              <th className="px-4 py-3">Camera</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Stato</th>
              <th className="px-4 py-3">Totale</th>
            </tr>
          </thead>
          <tbody>
            {reservations.map((reservation) => {
              const expires = optionExpiryLabel({ status: reservation.status, createdAt: reservation.createdAt, timeZone });
              return (
                <tr key={reservation.id} className="border-t border-[var(--pms-line)]">
                  <td className="px-4 py-3">
                    <Link href={`/pms/reservations/${reservation.id}`} className="underline-offset-2 hover:underline">
                      {reservation.code}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{guestDisplay(reservation.guest.firstName, reservation.guest.lastName)}</td>
                  <td className="px-4 py-3">{reservation.room.number}</td>
                  <td className="px-4 py-3">
                    {toISODate(reservation.checkIn)} → {toISODate(reservation.checkOut)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex flex-wrap items-center gap-2">
                      <StatusBadge label={reservationStatusMeta[reservation.status].label} tone={reservationStatusMeta[reservation.status].tone} />
                      {isPayAtPropertyRequest(reservation) ? <StatusBadge label="Richiesta web" tone="amber" /> : null}
                    </span>
                    {expires ? <p className="mt-1 text-xs text-[var(--pms-muted)]">{expires}</p> : null}
                  </td>
                  <td className="px-4 py-3">{formatMoney(reservation.total, reservation.currency)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      )}
    </div>
  );
}
