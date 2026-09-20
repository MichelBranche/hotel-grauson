import { requirePermission } from "@pms-core/auth/guards";
import { rateService } from "@pms-core/services/rate.service";
import { formatMoney } from "@pms-core/lib/money";

export default async function RatesPage() {
  const session = await requirePermission("rates.read");
  const [plans, extras] = await Promise.all([rateService.list(session.propertyId), rateService.extras(session.propertyId)]);

  return (
    <div className="space-y-6">
      <h1 className="font-[family-name:var(--font-sora)] text-2xl">Tariffe</h1>
      <div className="grid gap-4 lg:grid-cols-2">
        {plans.map((plan) => (
          <article key={plan.id} className="pms-card p-5">
            <p className="text-xs text-[var(--pms-muted)]">{plan.code}</p>
            <h2 className="font-[family-name:var(--font-sora)] text-xl">{plan.name}</h2>
            <p className="mt-2 text-sm text-[var(--pms-muted)]">{plan.cancellationPolicy}</p>
            <p className="mt-2 text-xs">{plan.isRefundable ? "Rimborsabile" : "Non rimborsabile"} · deposito {plan.depositPercent}%</p>
            <ul className="mt-4 space-y-1 text-sm">
              {plan.prices.map((price) => (
                <li key={price.id} className="flex justify-between">
                  <span>{price.roomType.name}</span>
                  <span>{formatMoney(price.basePrice)}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
      <section className="pms-card p-5">
        <h2 className="font-medium">Extra</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {extras.map((extra) => (
            <li key={extra.id} className="flex justify-between">
              <span>{extra.name}</span>
              <span>
                {formatMoney(extra.price)}
                {extra.perNight ? " / notte" : ""}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
