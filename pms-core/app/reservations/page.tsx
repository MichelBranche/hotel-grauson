import Link from "next/link";

import { requirePermission } from "@pms-core/auth/guards";
import { reservationStatusMeta } from "@pms-core/config/status";
import { StatusBadge } from "@pms-core/components/ui/badge";
import { reservationService } from "@pms-core/services/reservation.service";
import { toISODate } from "@pms-core/lib/dates";
import { formatMoney } from "@pms-core/lib/money";
import { guestDisplay } from "@pms-core/lib/utils";

export default async function ReservationsPage({
  searchParams,
}: {
  searchParams: Promise<{ room?: string }>;
}) {
  const session = await requirePermission("reservations.read");
  const { room } = await searchParams;
  const reservations = (await reservationService.list(session.propertyId)).filter((item) =>
    room ? item.room.number === room : true,
  );

  return (
    <div>
      <h1 className="font-[family-name:var(--font-sora)] text-2xl">Prenotazioni</h1>
      {room ? <p className="mt-1 text-sm text-[var(--pms-muted)]">Filtro camera {room}</p> : null}
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
            {reservations.map((reservation) => (
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
                  <StatusBadge label={reservationStatusMeta[reservation.status].label} tone={reservationStatusMeta[reservation.status].tone} />
                </td>
                <td className="px-4 py-3">{formatMoney(reservation.total, reservation.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
