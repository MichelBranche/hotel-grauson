import Image from "next/image";
import Link from "next/link";

import { SeasonalImage } from "@/components/ui/SeasonalImage";
import { catalogForType, rateLabel } from "@/lib/booking-catalog";
import { formatMoney } from "@pms-core/lib/money";
import type { AvailabilityOffer } from "@pms-core/types";

export function BookingOffers({
  offers,
  nights,
  roomTypeId,
  ratePlanId,
  onSelect,
}: {
  offers: AvailabilityOffer[];
  nights: number;
  roomTypeId: string;
  ratePlanId: string;
  onSelect: (roomTypeId: string, ratePlanId: string) => void;
}) {
  return (
    <ul className="space-y-4">
      {offers.map((offer) => {
        const catalog = catalogForType(offer.roomTypeName);
        const selected = roomTypeId === offer.roomTypeId;
        return (
          <li key={offer.roomTypeId}>
            <article
              className={`overflow-hidden rounded-[var(--radius-panel)] border bg-surface shadow-[var(--shadow-soft)] transition-[border-color] duration-500 ${
                selected ? "border-alpine/25" : "border-[rgb(37_39_33_/_0.06)]"
              }`}
            >
              <div className="grid lg:grid-cols-[minmax(0,17rem)_minmax(0,1fr)]">
                <div className="relative aspect-[5/4] overflow-hidden bg-alpine lg:aspect-auto lg:min-h-[16rem]">
                  {catalog.image.seasonal ? (
                    <SeasonalImage
                      slot={catalog.image.seasonal}
                      sizes="(min-width: 1024px) 17rem, 100vw"
                      className="object-cover"
                    />
                  ) : (
                    <Image
                      src={catalog.image.src}
                      alt={catalog.image.alt}
                      fill
                      sizes="(min-width: 1024px) 17rem, 100vw"
                      className="object-cover"
                    />
                  )}
                </div>

                <div className="flex flex-col justify-between gap-6 p-5 sm:p-6 lg:p-7">
                  <div>
                    <p className="text-[0.6875rem] tracking-[0.14em] text-muted uppercase">
                      {offer.remaining === 1 ? "Ultima camera" : `${offer.remaining} camere libere`}
                    </p>
                    <h3 className="display-md mt-2">{catalog.label}</h3>
                    <p className="mt-2 text-[0.875rem] text-muted">{catalog.promise}</p>
                    <Link
                      href={catalog.href}
                      className="mt-3 inline-block text-[0.75rem] text-ink underline decoration-[rgb(37_39_33_/_0.22)] underline-offset-4 hover:decoration-ink"
                    >
                      La camera
                    </Link>
                  </div>

                  <div className="grid gap-2">
                    {offer.ratePlans.map((plan) => {
                      const active = selected && ratePlanId === plan.id;
                      return (
                        <button
                          key={plan.id}
                          type="button"
                          onClick={() => onSelect(offer.roomTypeId, plan.id)}
                          className={`flex items-baseline justify-between gap-4 rounded-[18px] px-4 py-3 text-left transition-colors duration-400 ${
                            active ? "bg-alpine text-surface" : "bg-surface-deep/70 text-ink hover:bg-surface-deep"
                          }`}
                        >
                          <span>
                            <span className="block text-[0.875rem] font-medium">{rateLabel(plan.name)}</span>
                            <span className={`mt-0.5 block text-[0.6875rem] ${active ? "text-surface/70" : "text-muted"}`}>
                              {[
                                /rimborsabile/i.test(plan.name) ? null : plan.refundable ? "Flessibile" : "Non rimborsabile",
                                nights > 1 ? `${formatMoney(plan.nightly)} a notte` : null,
                              ]
                                .filter(Boolean)
                                .join(" · ")}
                            </span>
                          </span>
                          <span className="shrink-0 text-[0.9375rem] font-medium">{formatMoney(plan.total)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </article>
          </li>
        );
      })}
    </ul>
  );
}
