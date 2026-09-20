"use client";

import { useRef } from "react";

import { gsap, reducedMotion, useGSAP } from "@/lib/motion";

/**
 * Drifts each `[data-forest-speed]` layer at its own rate as the footer enters
 * the viewport, so the valley appears to open up with depth.
 */
export function ForestParallax({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (reducedMotion()) return;

      gsap.utils.toArray<HTMLElement>("[data-forest-speed]", scope.current).forEach((layer) => {
        const speed = Number(layer.dataset.forestSpeed ?? 1);
        gsap.fromTo(
          layer,
          { yPercent: speed },
          {
            yPercent: 0,
            ease: "none",
            scrollTrigger: {
              trigger: scope.current,
              start: "top bottom",
              end: "bottom bottom",
              scrub: true,
            },
          },
        );
      });
    },
    { scope },
  );

  return (
    <div ref={scope} className={className}>
      {children}
    </div>
  );
}
