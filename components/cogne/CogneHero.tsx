"use client";

import { useRef } from "react";

import { AutumnFall, AutumnStrays } from "@/components/effects/AutumnFall";
import { useSeason } from "@/components/providers/SeasonProvider";
import { ButtonLink } from "@/components/ui/Button";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { SeasonalImage } from "@/components/ui/SeasonalImage";
import { hotel } from "@/lib/content";
import { EASE, gsap, reducedMotion, useGSAP } from "@/lib/motion";

export function CogneHero() {
  const scope = useRef<HTMLElement>(null);
  const { season } = useSeason();

  useGSAP(
    () => {
      if (reducedMotion()) return;

      const q = gsap.utils.selector(scope);
      const tl = gsap.timeline({ delay: 0.1, defaults: { ease: EASE } });
      const desktop = window.matchMedia("(min-width: 768px)").matches;

      tl.to(q("[data-hero-frame]"), {
        clipPath: "inset(0% 0% 0% 0% round 34px)",
        duration: 1.65,
      })
        .to(q("[data-hero-media]"), { scale: 1, duration: desktop ? 2.4 : 0 }, 0)
        .to(q("[data-hero-el='eyebrow']"), { opacity: 1, y: 0, duration: 1 }, 0.55)
        .to(q("[data-hero-line] > span"), { y: 0, duration: 1.35, stagger: 0.12 }, 0.68)
        .to(q("[data-hero-el='lede']"), { opacity: 1, y: 0, duration: 1.1 }, 1.12)
        .to(q("[data-hero-el='note']"), { opacity: 1, y: 0, duration: 1.3 }, 1.18)
        .to(q("[data-hero-el='cta']"), { opacity: 1, y: 0, duration: 1, stagger: 0.12 }, 1.3);

      if (desktop) {
        gsap.to(q("[data-hero-media]"), {
          yPercent: 7,
          ease: "none",
          scrollTrigger: {
            trigger: scope.current,
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });
      }
    },
    { scope },
  );

  return (
    <section ref={scope} className="relative pt-2 sm:pt-2.5">
      <div className="shell relative">
        <div
          data-hero-frame
          className="relative isolate h-[min(92svh,46rem)] overflow-hidden rounded-[var(--radius-hero)] bg-alpine sm:h-[min(90svh,54rem)]"
        >
          <div data-hero-media className="absolute inset-0">
            <SeasonalImage
              slot="facciata"
              priority
              sizes="(max-width: 767px) 150vw, 100vw"
              quality={88}
              className="object-cover object-[center_42%]"
            />
          </div>

          <div
            aria-hidden
            className="absolute inset-0 bg-[linear-gradient(180deg,rgb(18_22_16_/_0.28)_0%,rgb(18_22_16_/_0.08)_38%,rgb(18_22_16_/_0.42)_72%,rgb(18_22_16_/_0.78)_100%)]"
          />
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-1/2 bg-[linear-gradient(to_top,rgb(18_22_16_/_0.55),transparent)]"
          />

          <p
            data-hero-el="note"
            className="hand hand-on-photo absolute top-[6.25rem] right-[var(--gutter)] hidden max-w-[9rem] rotate-[-4deg] text-right text-[1.2rem] text-surface/95 md:block lg:top-[7.25rem] lg:text-[1.35rem]"
          >
            Parco
            <br />
            Gran Paradiso
          </p>

          <div className="relative flex h-full flex-col justify-end p-[clamp(1.25rem,3vw,3.25rem)] pb-[clamp(1.35rem,2.6vw,2.6rem)] text-surface">
            {season === "autunno" ? <AutumnFall /> : null}
            <div className="relative z-[1] max-w-[40rem]">
              <p data-hero-el="eyebrow" className="eyebrow flex items-center gap-3 text-surface/75">
                Il territorio · {hotel.hamlet}
                <span aria-hidden className="h-px w-10 bg-surface/35 sm:w-14" />
              </p>

              <h1 className="display-xl mt-6 sm:mt-8">
                <span data-hero-line>
                  <span>Cogne</span>
                </span>
                <span data-hero-line>
                  <span>e il territorio</span>
                </span>
              </h1>

              <p
                data-hero-el="lede"
                className="mt-7 max-w-[30rem] text-[0.95rem] leading-relaxed text-surface/80 sm:mt-8 sm:text-[1.0625rem]"
              >
                Gimillan a 1.800 m, Cogne a 1.540 m. Vallone del Grauson, cascate di Lillaz, 70 km
                di piste da fondo. Sentieri da fonti ufficiali.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
                <span data-hero-el="cta">
                  <MagneticButton>
                    <ButtonLink href="#carta" variant="light" size="lg">
                      La carta
                    </ButtonLink>
                  </MagneticButton>
                </span>
                <span data-hero-el="cta">
                  <a
                    href="#sentieri"
                    className="text-[0.8125rem] text-surface/75 underline decoration-surface/25 underline-offset-4 transition-colors duration-400 hover:text-surface hover:decoration-surface"
                  >
                    I sentieri
                  </a>
                </span>
              </div>
            </div>
          </div>
        </div>

        {season === "autunno" ? <AutumnStrays /> : null}
      </div>
    </section>
  );
}
