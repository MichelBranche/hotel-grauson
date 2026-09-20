"use client";

import Image from "next/image";
import { useRef } from "react";

import { SeasonalImage } from "@/components/ui/SeasonalImage";
import { EASE, gsap, reducedMotion, useGSAP } from "@/lib/motion";
import type { RoomMedia } from "@/lib/rooms";

type PageHeroProps = {
  eyebrow: string;
  title: readonly [string, string] | readonly [string];
  lede?: string;
  note?: string;
  media: RoomMedia;
  /** Quiet line under the lede — occupancy, size, hamlet. */
  detail?: string;
};

export function PageHero({ eyebrow, title, lede, note, media, detail }: PageHeroProps) {
  const scope = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (reducedMotion()) return;

      const q = gsap.utils.selector(scope);
      const tl = gsap.timeline({ delay: 0.1, defaults: { ease: EASE } });
      const desktop = window.matchMedia("(min-width: 768px)").matches;

      tl.to(q("[data-hero-frame]"), {
        clipPath: "inset(0% 0% 0% 0% round 34px)",
        duration: 1.5,
      })
        .to(q("[data-hero-media]"), { scale: 1, duration: desktop ? 2.2 : 0 }, 0)
        .to(q("[data-hero-el='eyebrow']"), { opacity: 1, y: 0, duration: 0.95 }, 0.5)
        .to(q("[data-hero-line] > span"), { y: 0, duration: 1.25, stagger: 0.12 }, 0.62);

      const lede = q("[data-hero-el='lede']");
      const note = q("[data-hero-el='note']");
      const detail = q("[data-hero-el='detail']");
      if (lede.length) tl.to(lede, { opacity: 1, y: 0, duration: 1 }, 1.05);
      if (note.length) tl.to(note, { opacity: 1, y: 0, duration: 1.2 }, 1.1);
      if (detail.length) tl.to(detail, { opacity: 1, y: 0, duration: 1 }, 1.25);

      if (desktop) {
        gsap.to(q("[data-hero-media]"), {
          yPercent: 6,
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
          className="relative isolate h-[min(78svh,38rem)] overflow-hidden rounded-[var(--radius-hero)] bg-alpine sm:h-[min(76svh,42rem)]"
        >
          <div data-hero-media className="absolute inset-0">
            {media.seasonal ? (
              <SeasonalImage
                slot={media.seasonal}
                priority
                sizes="(max-width: 767px) 150vw, 100vw"
                quality={88}
                className="object-cover object-[center_42%]"
              />
            ) : (
              <Image
                src={media.src}
                alt={media.alt}
                fill
                priority
                sizes="(max-width: 767px) 150vw, 100vw"
                quality={88}
                className="object-cover object-[center_36%]"
              />
            )}
          </div>

          <div
            aria-hidden
            className="absolute inset-0 bg-[linear-gradient(105deg,rgb(18_22_16_/_0.78)_0%,rgb(18_22_16_/_0.42)_38%,rgb(18_22_16_/_0.05)_66%,transparent_100%)]"
          />
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-1/2 bg-[linear-gradient(to_top,rgb(18_22_16_/_0.62),transparent)]"
          />

          {note ? (
            <p
              data-hero-el="note"
              className="hand hand-on-photo absolute top-[6.25rem] right-[var(--gutter)] hidden max-w-[9rem] rotate-[-4deg] text-right text-[1.2rem] whitespace-pre-line text-surface/95 md:block lg:top-[7.25rem] lg:text-[1.35rem]"
            >
              {note}
            </p>
          ) : null}

          <div className="relative flex h-full flex-col justify-end p-[clamp(1.25rem,3vw,3.25rem)] pb-[clamp(1.35rem,2.6vw,2.6rem)] text-surface">
            <div className="max-w-[40rem]">
              <p data-hero-el="eyebrow" className="eyebrow flex items-center gap-3 text-surface/75">
                {eyebrow}
                <span aria-hidden className="h-px w-10 bg-surface/35 sm:w-14" />
              </p>

              <h1 className="display-xl mt-6 sm:mt-8">
                {title.map((line) => (
                  <span key={line} data-hero-line>
                    <span>{line}</span>
                  </span>
                ))}
              </h1>

              {lede ? (
                <p
                  data-hero-el="lede"
                  className="mt-7 max-w-[28rem] text-[0.95rem] leading-relaxed text-surface/80 sm:mt-8 sm:text-[1.0625rem]"
                >
                  {lede}
                </p>
              ) : null}

              {detail ? (
                <p
                  data-hero-el="detail"
                  className="mt-6 text-[0.75rem] tracking-[0.08em] text-surface/62 uppercase"
                >
                  {detail}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
