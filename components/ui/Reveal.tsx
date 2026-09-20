"use client";

import { useRef } from "react";

import { EASE, gsap, reducedMotion, useGSAP } from "@/lib/motion";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  /** Distance travelled by each revealed child, in px. */
  y?: number;
  stagger?: number;
  delay?: number;
  start?: string;
  as?: "div" | "section" | "header" | "aside" | "footer" | "ul";
};

/**
 * Reveals every `[data-reveal]` descendant once the group enters the viewport.
 * Pre-animation states live in CSS under `.has-motion`, so the markup stays
 * visible without JS and under prefers-reduced-motion.
 */
export function Reveal({
  children,
  className,
  y = 26,
  stagger = 0.09,
  delay = 0,
  start = "top 82%",
  as: Tag = "div",
}: RevealProps) {
  const scope = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (reducedMotion()) return;
      const targets = gsap.utils.toArray<HTMLElement>("[data-reveal]", scope.current);
      if (!targets.length) return;

      gsap.to(targets, {
        opacity: 1,
        y: 0,
        duration: 1.15,
        ease: EASE,
        delay,
        stagger: {
          each: stagger,
          onComplete(this: gsap.core.Tween) {
            // Lock the rest state in CSS so a later revert/refresh cannot
            // re-apply the pre-animation offset and make the block jump.
            (this.targets<HTMLElement>()[0] as HTMLElement | undefined)?.setAttribute("data-in", "");
          },
        },
        scrollTrigger: { trigger: scope.current, start, once: true },
      });
    },
    { scope },
  );

  return (
    // @ts-expect-error -- polymorphic tag with a shared HTMLElement ref
    <Tag ref={scope} className={className} style={{ "--reveal-y": `${y}px` }}>
      {children}
    </Tag>
  );
}
