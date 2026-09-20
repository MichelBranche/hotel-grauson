import { notFound } from "next/navigation";

import { requirePermission } from "@pms-core/auth/guards";
import { guestService } from "@pms-core/services/guest.service";
import { formatMoney } from "@pms-core/lib/money";
import { toISODate } from "@pms-core/lib/dates";
import { guestDisplay } from "@pms-core/lib/utils";

export default async function GuestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("guests.read");
  const { id } = await params;
  const guest = await guestService.get(id);
  if (!guest) notFound();
  const spent = guest.reservations.reduce((sum, item) => sum + item.total, 0);
  const lastStay = guest.reservations[0];

  return (
    <div className="space-y-5">
      <div className="pms-card p-6">
        <h1 className="font-[family-name:var(--font-sora)] text-3xl">{guestDisplay(guest.firstName, guest.lastName)}</h1>
        <p className="mt-2 text-sm text-[var(--pms-muted)]">
          {guest.email} · {guest.phone} · {guest.country}
        </p>
        <p className="mt-4 text-sm">
          Spesa totale {formatMoney(spent)} · ultimo soggiorno {lastStay ? toISODate(lastStay.checkIn) : "—"}
        </p>
        {guest.notes ? <p className="mt-3 text-sm">{guest.notes}</p> : null}
      </div>
      <section className="pms-card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-[var(--pms-muted)]">
            <tr>
              <th className="px-4 py-3">Codice</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Camera</th>
              <th className="px-4 py-3">Totale</th>
            </tr>
          </thead>
          <tbody>
            {guest.reservations.map((reservation) => (
              <tr key={reservation.id} className="border-t border-[var(--pms-line)]">
                <td className="px-4 py-3">{reservation.code}</td>
                <td className="px-4 py-3">
                  {toISODate(reservation.checkIn)} → {toISODate(reservation.checkOut)}
                </td>
                <td className="px-4 py-3">{reservation.room.number}</td>
                <td className="px-4 py-3">{formatMoney(reservation.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
