import { requirePermission } from "@pms-core/auth/guards";
import { prisma } from "@pms-core/database/client";
import { toISODate } from "@pms-core/lib/dates";
import { guestDisplay } from "@pms-core/lib/utils";

export default async function BookingEnginePage() {
  const session = await requirePermission("reservations.read");
  const web = await prisma.reservation.findMany({
    where: { propertyId: session.propertyId, source: "website" },
    include: { guest: true, room: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-[family-name:var(--font-sora)] text-2xl">Booking engine</h1>
        <p className="text-sm text-[var(--pms-muted)]">
          Il sito pubblico usa lo stesso AvailabilityService e ReservationService. Una sola source of truth.
        </p>
      </div>
      <section className="pms-card p-5">
        <p className="text-sm">Endpoint interno: <code>/booking</code></p>
        <p className="mt-2 text-sm text-[var(--pms-muted)]">Interfacce: getAvailability(), createReservation(), getReservation()</p>
      </section>
      <section className="pms-card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-[var(--pms-muted)]">
            <tr>
              <th className="px-4 py-3">Codice</th>
              <th className="px-4 py-3">Ospite</th>
              <th className="px-4 py-3">Camera</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {web.map((reservation) => (
              <tr key={reservation.id} className="border-t border-[var(--pms-line)]">
                <td className="px-4 py-3">{reservation.code}</td>
                <td className="px-4 py-3">{guestDisplay(reservation.guest.firstName, reservation.guest.lastName)}</td>
                <td className="px-4 py-3">{reservation.room.number}</td>
                <td className="px-4 py-3">
                  {toISODate(reservation.checkIn)} → {toISODate(reservation.checkOut)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
