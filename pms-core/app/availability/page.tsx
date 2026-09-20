import { requirePermission } from "@pms-core/auth/guards";
import { availabilityService } from "@pms-core/services/availability.service";
import { addDaysISO, todayISO } from "@pms-core/lib/dates";
import { formatMoney } from "@pms-core/lib/money";

export default async function AvailabilityPage() {
  const session = await requirePermission("availability.read");
  const checkIn = todayISO();
  const checkOut = addDaysISO(checkIn, 3);
  const offers = await availabilityService.search({
    propertyId: session.propertyId,
    checkIn,
    checkOut,
    adults: 2,
  });

  return (
    <div>
      <h1 className="font-[family-name:var(--font-sora)] text-2xl">Disponibilità</h1>
      <p className="mt-1 text-sm text-[var(--pms-muted)]">
        {checkIn} → {checkOut} · 2 adulti
      </p>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {offers.map((offer) => (
          <article key={offer.roomTypeId} className="pms-card p-5">
            <h2 className="pms-title">{offer.roomTypeName}</h2>
            <p className="text-sm text-[var(--pms-muted)]">{offer.remaining} camere · {offer.availableRooms.map((room) => room.number).join(", ")}</p>
            <ul className="mt-3 space-y-1 text-sm">
              {offer.ratePlans.map((plan) => (
                <li key={plan.id} className="flex justify-between">
                  <span>{plan.name}</span>
                  <span>{formatMoney(plan.total)}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </div>
  );
}
