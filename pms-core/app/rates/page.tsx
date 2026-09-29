import { can } from "@pms-core/config/permissions";
import { requirePermission } from "@pms-core/auth/guards";
import { PlanPanel } from "@pms-core/components/rates/plan-panel";
import { RateCalendar } from "@pms-core/components/rates/rate-calendar";
import { SeasonPanel } from "@pms-core/components/rates/season-panel";
import type { PlanView, SeasonView } from "@pms-core/components/rates/types";
import { todayISO, toISODate } from "@pms-core/lib/dates";
import { formatMoney } from "@pms-core/lib/money";
import { pricingService } from "@pms-core/services/pricing.service";
import { rateService } from "@pms-core/services/rate.service";

const CALENDAR_DAYS = 21;

export default async function RatesPage({ searchParams }: { searchParams: Promise<{ from?: string; plan?: string }> }) {
  const session = await requirePermission("rates.read");
  const params = await searchParams;
  const today = todayISO();
  const from = params.from && /^\d{4}-\d{2}-\d{2}$/.test(params.from) ? params.from : today;

  const [plans, roomTypes, seasons, extras] = await Promise.all([
    rateService.list(session.propertyId),
    rateService.roomTypes(session.propertyId),
    rateService.listSeasons(session.propertyId),
    rateService.extras(session.propertyId),
  ]);

  const planViews: PlanView[] = plans.map((plan) => ({
    id: plan.id,
    code: plan.code,
    name: plan.name,
    description: plan.description,
    cancellationPolicy: plan.cancellationPolicy,
    depositPercent: plan.depositPercent,
    minimumStay: plan.minimumStay,
    maximumStay: plan.maximumStay,
    isRefundable: plan.isRefundable,
    active: plan.active,
    reservationCount: plan._count.reservations,
    prices: Object.fromEntries(plan.prices.map((price) => [price.roomTypeId, price.basePrice])),
  }));
  const seasonViews: SeasonView[] = seasons.map((season) => ({
    id: season.id,
    name: season.name,
    ratePlanId: season.ratePlanId,
    ratePlanName: season.ratePlan?.name ?? null,
    startDate: toISODate(season.startDate),
    endDate: toISODate(season.endDate),
    minStay: season.minStay,
    maxStay: season.maxStay,
    closedToArrival: season.closedToArrival,
    closedToDeparture: season.closedToDeparture,
    notes: season.notes,
    prices: Object.fromEntries(season.prices.map((price) => [price.roomTypeId, price.price])),
  }));

  const activePlans = planViews.filter((plan) => plan.active);
  const calendarPlan = activePlans.find((plan) => plan.id === params.plan) ?? activePlans[0];
  const calendar = calendarPlan ? await pricingService.calendar(session.propertyId, calendarPlan.id, from, CALENDAR_DAYS) : null;
  const canWrite = can(session.role, "rates.write");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl">Tariffe</h1>
        <p className="text-sm text-[var(--pms-muted)]">
          Prezzi, stagioni e soggiorni minimi. Planning, reception e sito usano le stesse regole.
          {canWrite ? "" : " Hai accesso in sola lettura."}
        </p>
      </div>

      <PlanPanel plans={planViews} roomTypes={roomTypes} canWrite={canWrite} />
      <SeasonPanel seasons={seasonViews} plans={planViews} roomTypes={roomTypes} today={today} canWrite={canWrite} />
      <RateCalendar
        data={calendar}
        plans={activePlans.map((plan) => ({ id: plan.id, name: plan.name }))}
        from={from}
        days={CALENDAR_DAYS}
        today={today}
      />

      <section className="pms-card p-5">
        <h2 className="font-medium">Extra</h2>
        {extras.length ? (
          <ul className="mt-3 space-y-2 text-sm">
            {extras.map((extra) => (
              <li key={extra.id} className="flex justify-between">
                <span>{extra.name}</span>
                <span className="tabular-nums">
                  {formatMoney(extra.price)}
                  {extra.perNight ? " / notte" : ""}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-[var(--pms-muted)]">Nessun extra attivo.</p>
        )}
      </section>
    </div>
  );
}
