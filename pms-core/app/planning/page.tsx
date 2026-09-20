import { BedDouble, CalendarDays, Sparkles } from "lucide-react";

import { requirePermission } from "@pms-core/auth/guards";
import { PlanningBoard } from "@pms-core/components/planning/planning-board";
import { KpiCard } from "@pms-core/components/kpi-card";
import { dashboardService } from "@pms-core/services/dashboard.service";
import { planningService } from "@pms-core/services/planning.service";
import { rateService } from "@pms-core/services/rate.service";
import { addDaysISO, todayISO } from "@pms-core/lib/dates";
import { OccupancyWidget } from "@pms-core/components/planning/side-widgets";

export default async function PlanningPage() {
  const session = await requirePermission("planning.read");
  const from = "2026-12-15";
  const to = addDaysISO(from, 14);
  const today = todayISO();
  const [planning, kpis, extras, recent] = await Promise.all([
    planningService.get(session.propertyId, from, to),
    dashboardService.kpis(session.propertyId, today, addDaysISO(today, 1)),
    rateService.extras(session.propertyId),
    dashboardService.recent(session.propertyId),
  ]);

  return (
    <div className="space-y-5">
      <div className="flex gap-3 overflow-auto pms-scroll pb-1">
        <KpiCard icon={BedDouble} label="Camere totali" value={kpis.totalRooms} />
        <KpiCard icon={BedDouble} label="Occupate" value={kpis.occupied} hint={`${Math.round(kpis.occupancy * 100)}%`} />
        <KpiCard icon={BedDouble} label="Libere" value={kpis.free} />
        <KpiCard icon={Sparkles} label="In pulizia" value={kpis.cleaning} />
        <KpiCard icon={BedDouble} label="Fuori servizio" value={kpis.outOfOrder} />
        <KpiCard icon={CalendarDays} label="Arrivi oggi" value={kpis.arrivals} />
        <KpiCard icon={CalendarDays} label="Partenze oggi" value={kpis.departures} />
      </div>
      <PlanningBoard initial={{ ...planning, from }} extras={extras} />
      <OccupancyWidget occupancy={kpis.occupancy} free={kpis.free} cleaning={kpis.cleaning} recent={recent} />
    </div>
  );
}
