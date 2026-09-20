import { requirePermission } from "@pms-core/auth/guards";
import { reportService } from "@pms-core/services/report.service";
import { RevenueChart } from "@pms-core/components/reports/revenue-chart";
import { addDaysISO, todayISO } from "@pms-core/lib/dates";
import { formatMoney } from "@pms-core/lib/money";

export default async function ReportsPage() {
  const session = await requirePermission("reports.read");
  const from = todayISO();
  const to = addDaysISO(from, 30);
  const report = await reportService.summary(session.propertyId, from, to);

  const cards = [
    ["Occupazione", `${Math.round(report.occupancy * 100)}%`],
    ["ADR", formatMoney(report.adr)],
    ["RevPAR", formatMoney(report.revpar)],
    ["Revenue", formatMoney(report.revenue)],
    ["Arrivi", String(report.arrivals)],
    ["Partenze", String(report.departures)],
    ["Cancellazioni", String(report.cancellations)],
    ["No-show", String(report.noShows)],
    ["Soggiorno medio", `${report.alos} notti`],
  ];

  return (
    <div className="space-y-5">
      <h1 className="font-[family-name:var(--font-sora)] text-2xl">Report</h1>
      <div className="grid gap-3 md:grid-cols-3">
        {cards.map(([label, value]) => (
          <article key={label} className="pms-card p-4">
            <p className="text-xs text-[var(--pms-muted)]">{label}</p>
            <p className="mt-2 font-[family-name:var(--font-sora)] text-2xl">{value}</p>
          </article>
        ))}
      </div>
      <RevenueChart data={report.series} />
    </div>
  );
}
