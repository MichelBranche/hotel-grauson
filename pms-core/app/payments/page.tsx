import { requirePermission } from "@pms-core/auth/guards";
import { paymentService } from "@pms-core/services/payment.service";
import { formatMoney } from "@pms-core/lib/money";
import { guestDisplay } from "@pms-core/lib/utils";

export default async function PaymentsPage() {
  const session = await requirePermission("payments.read");
  const payments = await paymentService.list(session.propertyId);

  return (
    <div>
      <h1 className="font-[family-name:var(--font-sora)] text-2xl">Pagamenti</h1>
      <div className="pms-card mt-5 overflow-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="text-xs text-[var(--pms-muted)]">
            <tr>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Prenotazione</th>
              <th className="px-4 py-3">Ospite</th>
              <th className="px-4 py-3">Metodo</th>
              <th className="px-4 py-3">Importo</th>
              <th className="px-4 py-3">Stato</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.id} className="border-t border-[var(--pms-line)]">
                <td className="px-4 py-3">{payment.createdAt.toLocaleString("it-IT")}</td>
                <td className="px-4 py-3">{payment.reservation.code}</td>
                <td className="px-4 py-3">{guestDisplay(payment.reservation.guest.firstName, payment.reservation.guest.lastName)}</td>
                <td className="px-4 py-3">{payment.method}</td>
                <td className="px-4 py-3">{formatMoney(payment.amount, payment.currency)}</td>
                <td className="px-4 py-3">{payment.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
