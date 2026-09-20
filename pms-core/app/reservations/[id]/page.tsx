import Link from "next/link";
import { notFound } from "next/navigation";

import { requirePermission } from "@pms-core/auth/guards";
import { reservationRepo } from "@pms-core/database/repositories/reservation.repo";
import { auditService } from "@pms-core/services/audit.service";
import { reservationStatusMeta } from "@pms-core/config/status";
import { StatusBadge } from "@pms-core/components/ui/badge";
import { toISODate } from "@pms-core/lib/dates";
import { formatMoney } from "@pms-core/lib/money";
import { guestDisplay, parseJson } from "@pms-core/lib/utils";

export default async function ReservationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("reservations.read");
  const { id } = await params;
  const reservation = await reservationRepo.findById(id);
  if (!reservation) notFound();
  const audit = await auditService.list(reservation.propertyId, reservation.id);
  const paid = reservation.payments.reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs text-[var(--pms-muted)]">{reservation.code}</p>
          <h1 className="font-[family-name:var(--font-sora)] text-3xl">
            {guestDisplay(reservation.guest.firstName, reservation.guest.lastName)}
          </h1>
        </div>
        <StatusBadge label={reservationStatusMeta[reservation.status].label} tone={reservationStatusMeta[reservation.status].tone} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="pms-card p-5 text-sm">
          <p>Email: {reservation.guest.email ?? "—"}</p>
          <p>Telefono: {reservation.guest.phone ?? "—"}</p>
          <p>
            {toISODate(reservation.checkIn)} → {toISODate(reservation.checkOut)} · {reservation.nights} notti
          </p>
          <p>
            Camera {reservation.room.number} · {reservation.roomType.name}
          </p>
          <p>
            {reservation.adults} adulti{reservation.children ? ` · ${reservation.children} bambini` : ""}
          </p>
          <p>Canale: {reservation.channel} · fonte {reservation.source}</p>
          <p className="mt-3">Totale {formatMoney(reservation.total)} · pagato {formatMoney(paid)}</p>
          <Link href="/pms/planning" className="mt-4 inline-block text-xs underline">
            Apri nel planning
          </Link>
        </section>
        <section className="pms-card p-5">
          <h2 className="text-sm text-[var(--pms-muted)]">Audit</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {audit.map((entry) => (
              <li key={entry.id}>
                <p className="font-medium">{entry.action}</p>
                <p className="text-xs text-[var(--pms-muted)]">
                  {entry.user ? `${entry.user.firstName} ${entry.user.lastName}` : "Sistema"} · {entry.createdAt.toLocaleString("it-IT")}
                </p>
                {entry.after ? <p className="text-xs text-[var(--pms-muted)]">{JSON.stringify(parseJson(entry.after, {}))}</p> : null}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
