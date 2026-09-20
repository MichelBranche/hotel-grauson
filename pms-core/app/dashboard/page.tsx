import { BedDouble, CalendarDays, Euro, Percent } from "lucide-react";

import { requirePermission } from "@pms-core/auth/guards";
import { KpiCard } from "@pms-core/components/kpi-card";
import { OccupancyWidget } from "@pms-core/components/planning/side-widgets";
import { dashboardService } from "@pms-core/services/dashboard.service";
import { reportService } from "@pms-core/services/report.service";
import { addDaysISO, todayISO } from "@pms-core/lib/dates";
import { formatMoney } from "@pms-core/lib/money";
import { RevenueChart } from "@pms-core/components/reports/revenue-chart";

export default async function DashboardPage() {
  const session = await requirePermission("dashboard.read");
  const from = todayISO();
  const to = addDaysISO(from, 7);
  const [kpis, recent, reports] = await Promise.all([
    dashboardService.kpis(session.propertyId, from, to),
    dashboardService.recent(session.propertyId),
    reportService.summary(session.propertyId, from, addDaysISO(from, 30)),
  ]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-[family-name:var(--font-sora)] text-2xl">Dashboard</h1>
        <p className="text-sm text-[var(--pms-muted)]">Sintesi operativa della struttura</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard icon={BedDouble} label="Camere totali" value={kpis.totalRooms} />
        <KpiCard icon={Percent} label="Occupazione" value={`${Math.round(kpis.occupancy * 100)}%`} />
        <KpiCard icon={Euro} label="ADR" value={formatMoney(kpis.adr)} />
        <KpiCard icon={Euro} label="RevPAR" value={formatMoney(kpis.revpar)} />
        <KpiCard icon={Euro} label="Revenue" value={formatMoney(kpis.revenue)} />
        <KpiCard icon={BedDouble} label="Occupate" value={kpis.occupied} />
        <KpiCard icon={BedDouble} label="Libere" value={kpis.free} />
        <KpiCard icon={BedDouble} label="Fuori servizio" value={kpis.outOfOrder} />
        <KpiCard icon={CalendarDays} label="Arrivi oggi" value={kpis.arrivals} />
        <KpiCard icon={CalendarDays} label="Partenze oggi" value={kpis.departures} />
      </div>
      <RevenueChart data={reports.series} />
      <OccupancyWidget occupancy={kpis.occupancy} free={kpis.free} cleaning={kpis.cleaning} recent={recent} />
    </div>
  );
}
