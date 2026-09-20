"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
  gsap.defaults({ ease: "power3.out", duration: 1 });
}

/** Long, soft easing used across the site so every motion shares one voice. */
export const EASE = "power3.out";
export const EASE_SOFT = "power2.out";

/** Title mask: GSAP owns the rise. CSS only hides — a % translate in the
 *  stylesheet would be read as pixels and fight yPercent. */
export function revealHeroTitle(
  timeline: gsap.core.Timeline,
  lines: gsap.TweenTarget,
  at = 0.52,
) {
  timeline.fromTo(
    lines,
    { y: 0, yPercent: 120, opacity: 0 },
    {
      y: 0,
      yPercent: 0,
      opacity: 1,
      duration: 1.55,
      stagger: 0.18,
      ease: "cubic-bezier(0.16, 1, 0.3, 1)",
      overwrite: "auto",
    },
    at,
  );
}

export function reducedMotion() {
  if (typeof window === "undefined") return true;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return true;
  const connection = (navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string };
  }).connection;
  if (connection?.saveData) return true;
  return connection?.effectiveType === "slow-2g" || connection?.effectiveType === "2g";
}

export { gsap, ScrollTrigger, useGSAP };
