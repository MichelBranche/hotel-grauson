"use client";

import Image from "next/image";
import { useRef } from "react";

import { EASE, gsap, reducedMotion, useGSAP } from "@/lib/motion";
import { kitchenSlides } from "@/lib/restaurant";

export function RestaurantPin() {
  const scope = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (reducedMotion()) return;

      const mm = gsap.matchMedia();
      mm.add("(min-width: 64rem)", () => {
        const slides = gsap.utils.toArray<HTMLElement>("[data-pin-slide]", scope.current);
        if (slides.length < 2) return;

        gsap.set(slides, { opacity: 0, y: 18 });
        gsap.set(slides[0], { opacity: 1, y: 0 });

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: scope.current,
            start: "top top",
            end: `+=${slides.length * 90}%`,
            pin: true,
            scrub: 0.65,
            anticipatePin: 1,
          },
        });

        slides.forEach((slide, index) => {
          if (index === 0) return;
          tl.to(slides[index - 1], { opacity: 0, y: -18, duration: 1, ease: EASE }, index - 0.05).to(
            slide,
            { opacity: 1, y: 0, duration: 1, ease: EASE },
            "<0.15",
          );
        });
      });

      return () => mm.revert();
    },
    { scope },
  );

  return (
    <section
      ref={scope}
      aria-labelledby="tavola-title"
      className="relative mt-5 sm:mt-7"
    >
      <div className="shell lg:flex lg:h-svh lg:items-center lg:gap-10">
        <h2 id="tavola-title" className="sr-only">
          Il ristorante della locanda
        </h2>
        <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-hero)] bg-alpine sm:aspect-[16/10] lg:aspect-auto lg:h-[min(78svh,44rem)] lg:w-[58%]">
          <Image
            src="/images/bar-locanda.jpg"
            alt="Il banco della locanda, in legno, con le bottiglie e i tavoli della sala"
            fill
            sizes="(max-width: 1023px) 92vw, 58vw"
            className="object-cover object-[center_42%]"
          />
        </div>

        <div className="mt-8 px-1 lg:mt-0 lg:w-[42%] lg:px-0">
          <div className="flex flex-col gap-12 lg:hidden">
            {kitchenSlides.map((slide) => (
              <Slide key={slide.index} slide={slide} />
            ))}
          </div>

          <div className="relative hidden min-h-[18rem] lg:block">
            {kitchenSlides.map((slide, index) => (
              <div
                key={slide.index}
                data-pin-slide
                className={index === 0 ? "relative" : "absolute inset-0"}
              >
                <Slide slide={slide} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Slide({ slide }: { slide: (typeof kitchenSlides)[number] }) {
  return (
    <div>
      <p className="eyebrow flex items-center gap-3 text-muted">
        {slide.index} · {slide.eyebrow}
        <span aria-hidden className="h-px w-12 bg-[rgb(37_39_33_/_0.16)]" />
      </p>
      <p className="display-lg mt-5 max-w-[16ch]">{slide.title}</p>
      <p className="lede mt-5 max-w-[32rem]">{slide.body}</p>
    </div>
  );
}
