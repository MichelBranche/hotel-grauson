"use client";

import { useRef } from "react";

import { EASE_SOFT, gsap, reducedMotion, useGSAP } from "@/lib/motion";

/**
 * Wraps a single CTA in a very restrained magnetic pull (max ~5px) on
 * fine-pointer devices only. Keyboard and touch behaviour is untouched.
 */
export function MagneticButton({
  children,
  className = "",
  strength = 5,
}: {
  children: React.ReactNode;
  className?: string;
  strength?: number;
}) {
  const wrap = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const el = wrap.current;
      if (!el || reducedMotion()) return;
      if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

      const move = gsap.quickTo(el, "x", { duration: 0.6, ease: EASE_SOFT });
      const moveY = gsap.quickTo(el, "y", { duration: 0.6, ease: EASE_SOFT });

      const onMove = (event: PointerEvent) => {
        const rect = el.getBoundingClientRect();
        move(((event.clientX - (rect.left + rect.width / 2)) / rect.width) * strength * 2);
        moveY(((event.clientY - (rect.top + rect.height / 2)) / rect.height) * strength * 2);
      };
      const onLeave = () => {
        move(0);
        moveY(0);
      };

      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerleave", onLeave);
      return () => {
        el.removeEventListener("pointermove", onMove);
        el.removeEventListener("pointerleave", onLeave);
      };
    },
    { scope: wrap },
  );

  return (
    <span ref={wrap} className={`inline-flex ${className}`}>
      {children}
    </span>
  );
}
