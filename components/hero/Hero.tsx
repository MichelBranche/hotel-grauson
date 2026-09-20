"use client";

import { Mountain } from "lucide-react";
import Image from "next/image";
import { useRef } from "react";

import { AutumnFall, AutumnStrays } from "@/components/effects/AutumnFall";
import { VideoCue } from "@/components/hero/VideoCue";
import { useSeason } from "@/components/providers/SeasonProvider";
import { ButtonLink } from "@/components/ui/Button";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { SeasonalImage } from "@/components/ui/SeasonalImage";
import { EASE, gsap, reducedMotion, useGSAP } from "@/lib/motion";
import { hotel } from "@/lib/content";

export function Hero() {
  const scope = useRef<HTMLElement>(null);
  const { media, season } = useSeason();

  useGSAP(
    () => {
      if (reducedMotion()) return;

      const q = gsap.utils.selector(scope);

      // Pre-animation states live in CSS (under `.has-motion`), so these are
      // plain `to` tweens reading whatever the stylesheet already set.
      const tl = gsap.timeline({ delay: 0.12, defaults: { ease: EASE } });

      const desktop = window.matchMedia("(min-width: 768px)").matches;

      tl.to(q("[data-hero-frame]"), {
        clipPath: "inset(0% 0% 0% 0% round 34px)",
        duration: 1.65,
      })
        .to(q("[data-hero-media]"), { scale: 1, duration: desktop ? 2.4 : 0 }, 0)
        // `y`, not `yPercent`: GSAP reads the stylesheet's translate3d(0,105%,0)
        // into its pixel channel, so the percentage channel would never move.
        .to(q("[data-hero-line] > span"), { y: 0, duration: 1.35, stagger: 0.12 }, 0.6)
        .to(q("[data-hero-el='lede']"), { opacity: 1, y: 0, duration: 1.1 }, 1.15)
        .to(q("[data-hero-el='note']"), { opacity: 1, y: 0, duration: 1.4 }, 1.2)
        .to(q("[data-hero-el='cta']"), { opacity: 1, y: 0, duration: 1, stagger: 0.12 }, 1.32)
        .to(
          q("[data-hero-el='detail']"),
          { opacity: 1, y: 0, duration: 1.1, stagger: 0.14 },
          1.5,
        );

      // Slow cinematic push while the hero leaves the viewport. Desktop only:
      // a live transform on the photograph makes iOS rasterise it soft.
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
    <section ref={scope} id="top" className="relative pt-2 sm:pt-2.5">
      <div className="shell relative">
        <div
          data-hero-frame
          className="relative isolate min-h-[min(78svh,38rem)] overflow-hidden rounded-[var(--radius-hero)] bg-alpine sm:h-[min(90svh,54rem)] sm:min-h-0"
        >
          <div data-hero-media className="absolute inset-0">
            <SeasonalImage
              slot="hero"
              priority
              sizes="(max-width: 767px) 150vw, 100vw"
              quality={88}
              className="object-cover object-[42%_center] sm:object-[42%_center]"
            />
          </div>

          {/* Scrims: keep the photograph readable without flattening it. */}
          <div
            aria-hidden
            className="absolute inset-0 bg-[linear-gradient(105deg,rgb(18_22_16_/_0.78)_0%,rgb(18_22_16_/_0.42)_38%,rgb(18_22_16_/_0.05)_66%,transparent_100%)]"
          />
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-1/2 bg-[linear-gradient(to_top,rgb(18_22_16_/_0.6),transparent)]"
          />

          {/* Localised vignette so the handwritten note reads over bright sky. */}
          <div
            aria-hidden
            className="absolute top-0 right-0 hidden h-[42%] w-[42%] bg-[radial-gradient(ellipse_at_top_right,rgb(16_20_14_/_0.5),transparent_68%)] md:block"
          />

          <div data-hero-scene className="relative z-[2] sm:absolute sm:inset-0">
          <p
            data-hero-el="note"
            className="hand hand-on-photo absolute top-[6.25rem] right-[var(--gutter)] hidden max-w-[9rem] rotate-[-4deg] text-right text-[1.2rem] text-surface/95 md:block lg:top-[7.25rem] lg:text-[1.35rem]"
          >
            Gimillan
            <br />
            1.800 m
          </p>

          <div className="relative flex min-h-[min(78svh,38rem)] flex-col justify-end gap-6 p-5 pb-5 text-surface sm:h-full sm:min-h-0 sm:gap-8 sm:p-[clamp(1.25rem,3vw,3.25rem)] sm:pb-[clamp(1.25rem,2.4vw,2.5rem)]">
            {season === "autunno" ? <AutumnFall /> : null}
            <div className="relative z-[1] max-w-[40rem]">
              <h1 className="display-xl">
                <span data-hero-line>
                  <span>Locanda</span>
                </span>
                <span data-hero-line>
                  <span>Grauson</span>
                </span>
              </h1>

              <p
                data-hero-el="lede"
                className="mt-6 max-w-[26rem] text-[0.95rem] leading-relaxed text-pretty text-surface/80 sm:mt-10 sm:text-[1.0625rem]"
              >
                Hotel a Gimillan di Cogne, 1.800 m. Gestione familiare {hotel.family}, dal{" "}
                {hotel.since}.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3 sm:mt-9 sm:gap-x-6 sm:gap-y-4">
                <span data-hero-el="cta">
                  <MagneticButton>
                    <ButtonLink href="#la-locanda" variant="light" size="lg" className="max-sm:h-10 max-sm:px-4">
                      La locanda
                    </ButtonLink>
                  </MagneticButton>
                </span>
                <span data-hero-el="cta">
                  <VideoCue poster={media.hero.src} />
                </span>
              </div>
            </div>

            <div className="relative z-[1] flex flex-wrap items-end justify-between gap-6">
              <div data-hero-el="detail" className="flex items-center gap-4">
                <span className="relative size-[3.25rem] shrink-0 overflow-hidden rounded-full ring-1 ring-surface/30 sm:size-[3.5rem]">
                  <Image
                    src="/images/story-fireplace.jpg"
                    alt=""
                    fill
                    sizes="112px"
                    className="object-cover"
                  />
                </span>
                <p className="hand hand-on-photo text-[1.15rem] leading-[1.15] text-surface/92 sm:text-[1.3rem]">
                  Gestione familiare
                  <br />
                  dal {hotel.since}
                </p>
              </div>

              <div
                data-hero-el="detail"
                className="hidden items-center gap-3 rounded-full border border-[rgb(247_245_239_/_0.22)] bg-[rgb(18_22_16_/_0.3)] py-2.5 pr-5 pl-4 backdrop-blur-md sm:flex"
              >
                <Mountain className="size-[18px] shrink-0 text-surface/70" strokeWidth={1.4} aria-hidden />
                <span className="leading-tight">
                  <span className="block text-[0.8125rem] font-medium">
                    {hotel.hamlet} · {hotel.altitude}
                  </span>
                  <span className="block text-[0.6875rem] text-surface/60">
                    {hotel.address.city}, Valle d&apos;Aosta
                  </span>
                </span>
              </div>
            </div>
          </div>
          </div>
        </div>

        {season === "autunno" ? <AutumnStrays /> : null}
      </div>
    </section>
  );
}
