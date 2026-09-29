import { can } from "@pms-core/config/permissions";
import { requirePermission } from "@pms-core/auth/guards";
import { ClosuresPanel } from "@pms-core/components/rates/closures-panel";
import { Button } from "@pms-core/components/ui/button";
import { Field, Input } from "@pms-core/components/ui/input";
import { isDomainError } from "@pms-core/lib/errors";
import { addDaysISO, formatRange, nightsBetween, todayISO } from "@pms-core/lib/dates";
import { formatMoney } from "@pms-core/lib/money";
import { availabilityService } from "@pms-core/services/availability.service";
import { closureService } from "@pms-core/services/closure.service";
import type { AvailabilityResult } from "@pms-core/types";

const iso = (value?: string) => (value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null);

export default async function AvailabilityPage({
  searchParams,
}: {
  searchParams: Promise<{ checkIn?: string; checkOut?: string; adults?: string; children?: string }>;
}) {
  const session = await requirePermission("availability.read");
  const params = await searchParams;
  const today = todayISO();
  const checkIn = iso(params.checkIn) ?? today;
  const checkOut = iso(params.checkOut) ?? addDaysISO(checkIn, 3);
  const adults = Math.min(Math.max(Number(params.adults) || 2, 1), 12);
  const children = Math.min(Math.max(Number(params.children) || 0, 0), 12);

  let result: AvailabilityResult = { offers: [], unavailable: [] };
  let error: string | null = null;
  try {
    result = await availabilityService.searchDetailed({ propertyId: session.propertyId, checkIn, checkOut, adults, children });
  } catch (caught) {
    if (!isDomainError(caught)) throw caught;
    error = caught.message;
  }

  const [closures, targets] = await Promise.all([
    closureService.list(session.propertyId, today),
    closureService.targets(session.propertyId),
  ]);
  const nights = nightsBetween(checkIn, checkOut);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl">Disponibilità</h1>
        <p className="text-sm text-[var(--pms-muted)]">Stessa ricerca del booking online: prezzi, stagioni, soggiorni minimi e chiusure.</p>
      </div>

      <section className="space-y-4" aria-labelledby="ricerca-title">
        <h2 id="ricerca-title" className="sr-only">
          Verifica disponibilità
        </h2>
        <form className="pms-card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_0.6fr_0.6fr_auto] lg:items-end" method="get">
          <Field label="Check-in">
            <Input type="date" name="checkIn" defaultValue={checkIn} required />
          </Field>
          <Field label="Check-out">
            <Input type="date" name="checkOut" defaultValue={checkOut} required />
          </Field>
          <Field label="Adulti">
            <Input type="number" name="adults" min={1} max={12} defaultValue={adults} />
          </Field>
          <Field label="Bambini">
            <Input type="number" name="children" min={0} max={12} defaultValue={children} />
          </Field>
          <Button type="submit">Verifica</Button>
        </form>

        {error ? (
          <p role="alert" className="rounded-2xl bg-[rgb(138_59_59_/_0.08)] px-4 py-3 text-sm text-[#8a3b3b]">
            {error}
          </p>
        ) : (
          <>
            <p className="text-sm text-[var(--pms-muted)]">
              {formatRange(checkIn, checkOut)} · {nights} {nights === 1 ? "notte" : "notti"} · {adults} {adults === 1 ? "adulto" : "adulti"}
              {children ? ` · ${children} ${children === 1 ? "bambino" : "bambini"}` : ""}
            </p>
            {result.offers.length === 0 && result.unavailable.length === 0 ? (
              <p className="pms-card p-5 text-sm text-[var(--pms-muted)]">Nessuna tipologia attiva. Creale in Camere.</p>
            ) : null}
            <div className="grid gap-3 md:grid-cols-2">
              {result.offers.map((offer) => (
                <article key={offer.roomTypeId} className="pms-card p-5">
                  <h3 className="pms-title">{offer.roomTypeName}</h3>
                  <p className="text-sm text-[var(--pms-muted)]">
                    {offer.remaining} {offer.remaining === 1 ? "camera libera" : "camere libere"} · {offer.availableRooms.map((room) => room.number).join(", ")}
                  </p>
                  <ul className="mt-3 space-y-2 text-sm">
                    {offer.ratePlans.map((plan) => {
                      const seasons = [...new Set(plan.nights.map((night) => night.season).filter(Boolean))];
                      return (
                        <li key={plan.id} className="flex items-start justify-between gap-3">
                          <span>
                            {plan.name}
                            <span className="block text-xs text-[var(--pms-muted)]">
                              {formatMoney(plan.nightly)} a notte
                              {plan.minimumStay > 1 ? ` · min. ${plan.minimumStay} notti` : ""}
                              {seasons.length ? ` · ${seasons.join(", ")}` : ""}
                            </span>
                          </span>
                          <span className="font-medium tabular-nums">{formatMoney(plan.total)}</span>
                        </li>
                      );
                    })}
                  </ul>
                </article>
              ))}
              {result.unavailable.map((item) => (
                <article key={item.roomTypeId} className="rounded-[var(--pms-radius)] border border-dashed border-[var(--pms-line)] p-5">
                  <h3 className="pms-title text-[var(--pms-muted)]">{item.roomTypeName}</h3>
                  <p className="mt-1 text-sm">Non vendibile: {item.reason}</p>
                </article>
              ))}
            </div>
          </>
        )}
      </section>

      <ClosuresPanel
        typeClosures={closures.typeClosures}
        roomBlocks={closures.roomBlocks}
        roomTypes={targets.roomTypes}
        rooms={targets.rooms}
        canWrite={can(session.role, "availability.write")}
      />
    </div>
  );
}
