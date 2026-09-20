import Image from "next/image";
import Link from "next/link";

import { ArrowCircle } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { SeasonalImage } from "@/components/ui/SeasonalImage";
import { featureCards } from "@/lib/content";

const cardSizes = "(max-width: 767px) 78vw, (max-width: 1439px) 40vw, 640px";

export function FeatureCards() {
  return (
    <section aria-labelledby="scoperte-title" className="shell mt-5 sm:mt-7">
      <h2 id="scoperte-title" className="sr-only">
        La locanda, il ristorante e Cogne
      </h2>

      <Reveal
        className="-mx-[var(--gutter)] flex snap-x snap-mandatory gap-3 overflow-x-auto px-[var(--gutter)] pb-1 [scrollbar-width:none] sm:gap-4 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden"
        y={34}
        stagger={0.11}
      >
        {featureCards.map((card) => (
          <Link
            key={card.id}
            id={card.id}
            href={card.href}
            data-reveal
            className="group relative block w-[78vw] shrink-0 snap-start overflow-hidden rounded-[var(--radius-card)] bg-surface-deep transition-[transform,box-shadow] duration-[600ms] [transition-timing-function:var(--ease-out)] hover:-translate-y-1 hover:shadow-[var(--shadow-lift)] sm:w-[62vw] md:w-auto"
            aria-label={`${card.title} — ${card.description}`}
          >
            <div className="relative aspect-[4/3] w-full sm:aspect-[3/2]">
              {card.seasonal ? (
                <SeasonalImage
                  slot="cogne"
                  sizes={cardSizes}
                  className="card-media object-cover object-[center_42%]"
                />
              ) : (
                <Image
                  src={card.image}
                  alt={card.alt}
                  fill
                  sizes={cardSizes}
                  className="card-media object-cover object-[center_42%]"
                />
              )}
              <div
                aria-hidden
                className="absolute inset-0 bg-[linear-gradient(to_top,rgb(18_22_16_/_0.8)_0%,rgb(18_22_16_/_0.28)_42%,rgb(18_22_16_/_0.02)_70%,rgb(18_22_16_/_0.18)_100%)]"
              />
              <div
                aria-hidden
                className="absolute inset-0 bg-[linear-gradient(to_top,rgb(18_22_16_/_0.5),transparent_60%)] opacity-0 transition-opacity duration-[600ms] [transition-timing-function:var(--ease-out)] group-hover:opacity-100"
              />
            </div>

            <span className="absolute top-5 left-5 text-[0.6875rem] font-medium tracking-[0.14em] text-surface/75 [text-shadow:0_1px_12px_rgb(18_22_16_/_0.5)]">
              {card.index}
            </span>

            <div className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-4">
              <span className="text-surface">
                <span className="display-md block">{card.title}</span>
                <span className="mt-1.5 block text-[0.8125rem] text-surface/72">{card.description}</span>
              </span>
              <ArrowCircle />
            </div>
          </Link>
        ))}
      </Reveal>
    </section>
  );
}
