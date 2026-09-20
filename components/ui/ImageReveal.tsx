"use client";

import Image from "next/image";
import { useRef } from "react";

import { EffectImage } from "@/components/ui/EffectImage";
import { SeasonalImage } from "@/components/ui/SeasonalImage";
import type { EffectSlot } from "@/lib/effects";
import { EASE, gsap, reducedMotion, useGSAP } from "@/lib/motion";
import type { SeasonSlot } from "@/lib/seasons";

type ImageRevealProps = {
  sizes: string;
  className?: string;
  radius?: number;
  priority?: boolean;
  /** Vertical drift, in percent of the image height, across the viewport pass. */
  parallax?: number;
  children?: React.ReactNode;
} & (
  | { src: string; alt: string; seasonal?: never; effect?: EffectSlot }
  | { seasonal: SeasonSlot; src?: never; alt?: never; effect?: never }
);

/**
 * Masked image entrance: the frame opens from the centre while the photograph
 * settles from a slight over-scale, then drifts gently as the page scrolls.
 */
export function ImageReveal({
  src,
  alt,
  seasonal,
  effect,
  sizes,
  className = "",
  radius = 26,
  priority = false,
  parallax = 3.5,
  children,
}: ImageRevealProps) {
  const frame = useRef<HTMLDivElement>(null);
  const drift = useRef<HTMLDivElement>(null);
  const media = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (reducedMotion()) return;

      gsap
        .timeline({ scrollTrigger: { trigger: frame.current, start: "top 88%" } })
        .to(frame.current, {
          clipPath: `inset(0% 0% 0% 0% round ${radius}px)`,
          duration: 1.5,
          ease: EASE,
        })
        .to(media.current, { scale: 1, duration: 1.9, ease: EASE }, 0);

      if (parallax > 0) {
        gsap.fromTo(
          drift.current,
          { yPercent: -parallax },
          {
            yPercent: parallax,
            ease: "none",
            scrollTrigger: {
              trigger: frame.current,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          },
        );
      }
    },
    { scope: frame },
  );

  return (
    <div
      ref={frame}
      data-image-frame
      className={`relative overflow-hidden bg-surface-deep ${className}`}
      style={{ borderRadius: radius, ["--frame-radius" as string]: `${radius}px` }}
    >
      <div ref={drift} className="absolute inset-[-6%]">
        <div ref={media} data-image-media className="relative h-full w-full will-change-transform">
          {seasonal ? (
            <SeasonalImage slot={seasonal} sizes={sizes} priority={priority} className="object-cover" />
          ) : effect ? (
            <EffectImage
              src={src as string}
              alt={alt as string}
              slot={effect}
              sizes={sizes}
              priority={priority}
              className="object-cover"
            />
          ) : (
            <Image
              src={src as string}
              alt={alt as string}
              fill
              sizes={sizes}
              priority={priority}
              className="object-cover"
            />
          )}
        </div>
      </div>
      {children}
    </div>
  );
}
