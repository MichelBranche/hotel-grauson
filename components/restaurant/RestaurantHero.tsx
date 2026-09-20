"use client";

import Image from "next/image";
import { useRef } from "react";

import { ButtonLink } from "@/components/ui/Button";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { EASE, gsap, reducedMotion, revealHeroTitle, useGSAP } from "@/lib/motion";
import { hotel } from "@/lib/content";

export function RestaurantHero() {
  const scope = useRef<HTMLElement>(null);

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
        .to(q("[data-hero-el='eyebrow']"), { opacity: 1, y: 0, duration: 1 }, 0.55);

      revealHeroTitle(tl, q("[data-hero-line] > span"), 0.58);

      tl.to(q("[data-hero-el='lede']"), { opacity: 1, y: 0, duration: 1.1 }, 1.12)
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
      <div className="shell">
        <div
          data-hero-frame
          className="relative isolate h-[min(92svh,46rem)] overflow-hidden rounded-[var(--radius-hero)] bg-alpine sm:h-[min(90svh,54rem)]"
        >
          <div data-hero-media className="absolute inset-0">
            <Image
              src="/images/sala-ristorante.jpg"
              alt="Sala da pranzo in legno della Locanda Grauson, tavoli apparecchiati e le cime fuori dalle finestre"
              fill
              priority
              sizes="(max-width: 767px) 150vw, 100vw"
              quality={88}
              className="object-cover object-[58%_42%]"
            />
          </div>

          <div
            aria-hidden
            className="absolute inset-0 bg-[linear-gradient(105deg,rgb(18_22_16_/_0.8)_0%,rgb(18_22_16_/_0.42)_40%,rgb(18_22_16_/_0.08)_68%,transparent_100%)]"
          />
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-1/2 bg-[linear-gradient(to_top,rgb(18_22_16_/_0.58),transparent)]"
          />

          <p
            data-hero-el="note"
            className="hand hand-on-photo absolute top-[6.25rem] right-[var(--gutter)] hidden max-w-[9rem] rotate-[-4deg] text-right text-[1.2rem] text-surface/95 md:block lg:top-[7.25rem] lg:text-[1.35rem]"
          >
            Cucina
            <br />
            cogneintse
          </p>

          <div className="relative flex h-full flex-col justify-end p-[clamp(1.25rem,3vw,3.25rem)] pb-[clamp(1.35rem,2.6vw,2.6rem)] text-surface">
            <div className="max-w-[40rem]">
              <p data-hero-el="eyebrow" className="eyebrow flex items-center gap-3 text-surface/75">
                Il ristorante · {hotel.hamlet}
                <span aria-hidden className="h-px w-10 bg-surface/35 sm:w-14" />
              </p>

              <h1 className="display-xl mt-6 sm:mt-8">
                <span data-hero-line>
                  <span>Il ristorante</span>
                </span>
              </h1>

              <p
                data-hero-el="lede"
                className="mt-7 max-w-[28rem] text-[0.95rem] leading-relaxed text-surface/80 sm:mt-8 sm:text-[1.0625rem]"
              >
                Cucina cogneintse. Colazione con prodotti della valle e torte di produzione
                propria. Pranzo e cena su prenotazione: il menù del giorno si comunica in sala.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
                <span data-hero-el="cta">
                  <MagneticButton>
                    <ButtonLink href="#cucina" variant="light" size="lg">
                      La cucina
                    </ButtonLink>
                  </MagneticButton>
                </span>
                <span data-hero-el="cta">
                  <a
                    href={hotel.phoneHref}
                    className="text-[0.8125rem] text-surface/75 underline decoration-surface/25 underline-offset-4 transition-colors duration-400 hover:text-surface hover:decoration-surface"
                  >
                    Prenota un tavolo
                  </a>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
