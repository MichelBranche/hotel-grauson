import { BedDouble, CalendarDays, Sparkles } from "lucide-react";

import { requirePermission } from "@pms-core/auth/guards";
import { PlanningWorkspace } from "@pms-core/components/planning/planning-workspace";
import { KpiCard } from "@pms-core/components/kpi-card";
import { can } from "@pms-core/config/permissions";
import { propertyConfig } from "@pms-core/config/property";
import { prisma } from "@pms-core/database/client";
import { dashboardService } from "@pms-core/services/dashboard.service";
import { planningService } from "@pms-core/services/planning.service";
import { rateService } from "@pms-core/services/rate.service";
import { addDaysISO, todayISO, todayInTimeZone } from "@pms-core/lib/dates";
import { toRecentStays } from "@pms-core/lib/recent-stays";

const DEFAULT_FROM = "2026-12-15";
const DEFAULT_SPAN = 14;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export default async function PlanningPage({
  searchParams,
}: {
  searchParams: Promise<{ focus?: string; date?: string }>;
}) {
  const session = await requirePermission("planning.read");
  const { focus, date } = await searchParams;
  const focusDate = date && ISO_DATE.test(date) ? date : undefined;
  const from = focusDate ? addDaysISO(focusDate, -Math.floor(DEFAULT_SPAN / 2)) : DEFAULT_FROM;
  const to = addDaysISO(from, DEFAULT_SPAN);
  const today = todayISO();
  const [planning, kpis, extras, recent, plans, property] = await Promise.all([
    planningService.get(session.propertyId, from, to),
    dashboardService.kpis(session.propertyId, today, addDaysISO(today, 1)),
    rateService.extras(session.propertyId),
    dashboardService.recent(session.propertyId),
    prisma.ratePlan.findMany({
      where: { propertyId: session.propertyId, active: true },
      select: { id: true, code: true, name: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.property.findUnique({ where: { id: session.propertyId }, select: { timezone: true } }),
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
      <PlanningWorkspace
        initial={{ ...planning, from }}
        extras={extras}
        plans={plans}
        businessToday={todayInTimeZone(property?.timezone || propertyConfig.timezone)}
        permissions={{
          canWrite: can(session.role, "reservations.write"),
          canModify: can(session.role, "planning.move"),
          canCancel: can(session.role, "reservations.cancel"),
          canCheckIn: can(session.role, "reservations.checkin"),
          canPay: can(session.role, "payments.write"),
          canExtra: can(session.role, "reservations.write"),
          canForceCancel: session.role === "OWNER" || session.role === "ADMIN",
        }}
        canSetRoomStatus={can(session.role, "rooms.write") || can(session.role, "housekeeping.write")}
        roomStatusVia={can(session.role, "rooms.write") ? "rooms" : "housekeeping"}
        occupancy={kpis.occupancy}
        free={kpis.free}
        cleaning={kpis.cleaning}
        recent={toRecentStays(recent)}
        initialFocus={focus ? { id: focus, checkIn: focusDate } : null}
      />
    </div>
  );
}
