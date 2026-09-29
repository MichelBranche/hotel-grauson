import Link from "next/link";

import { requirePermission } from "@pms-core/auth/guards";
import { reservationStatusMeta } from "@pms-core/config/status";
import { propertyConfig } from "@pms-core/config/property";
import { StatusBadge } from "@pms-core/components/ui/badge";
import { prisma } from "@pms-core/database/client";
import { isPayAtPropertyRequest } from "@pms-core/lib/pay-at-property";
import { optionExpiryLabel } from "@pms-core/lib/option-hold";
import { reservationService } from "@pms-core/services/reservation.service";
import { toISODate } from "@pms-core/lib/dates";
import { formatMoney } from "@pms-core/lib/money";
import { cn, guestDisplay } from "@pms-core/lib/utils";

function listHref(room: string | undefined, queue: boolean) {
  const params = new URLSearchParams();
  if (room) params.set("room", room);
  if (queue) params.set("coda", "web");
  const query = params.toString();
  return query ? `/pms/reservations?${query}` : "/pms/reservations";
}

export default async function ReservationsPage({
  searchParams,
}: {
  searchParams: Promise<{ room?: string; coda?: string }>;
}) {
  const session = await requirePermission("reservations.read");
  const { room, coda } = await searchParams;
  const queue = coda === "web";
  const [rows, property] = await Promise.all([
    reservationService.list(session.propertyId),
    prisma.property.findUnique({ where: { id: session.propertyId }, select: { timezone: true } }),
  ]);
  const timeZone = property?.timezone || propertyConfig.timezone;
  const listed = rows.filter((item) => (room ? item.room.number === room : true));
  const webRequests = listed.filter((item) => isPayAtPropertyRequest(item));
  const reservations = queue ? webRequests : listed;

  return (
    <div>
      <h1 className="text-2xl">{queue ? "Richieste web" : "Prenotazioni"}</h1>
      <p className="mt-1 text-sm text-[var(--pms-muted)]">
        {room ? `Filtro camera ${room}. ` : null}
        {queue ? "Soggiorni dal sito in attesa. Il pagamento si fa in reception." : "Tutte le prenotazioni della locanda."}
      </p>
      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        <Link
          href={listHref(room, false)}
          className={cn(
            "rounded-full px-3 py-1",
            queue ? "text-[var(--pms-muted)] hover:bg-[var(--pms-surface-dark)]" : "bg-[var(--pms-alpine)] text-[var(--pms-surface)]",
          )}
          aria-current={queue ? undefined : "page"}
        >
          Tutte
        </Link>
        <Link
          href={listHref(room, true)}
          className={cn(
            "rounded-full px-3 py-1",
            queue ? "bg-[var(--pms-alpine)] text-[var(--pms-surface)]" : "text-[var(--pms-muted)] hover:bg-[var(--pms-surface-dark)]",
          )}
          aria-current={queue ? "page" : undefined}
        >
          Richieste web{webRequests.length ? ` · ${webRequests.length}` : ""}
        </Link>
      </div>
      {reservations.length === 0 ? (
        <div className="pms-card mt-5 px-4 py-8 text-sm text-[var(--pms-muted)]">
          {queue ? "Nessuna richiesta web in attesa." : "Nessuna prenotazione."}
        </div>
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
