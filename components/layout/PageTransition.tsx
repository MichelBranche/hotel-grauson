"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Wordmark } from "@/components/layout/Wordmark";
import { SeasonalImage } from "@/components/ui/SeasonalImage";
import { setScrollLocked } from "@/lib/lenis";
import { EASE, gsap, reducedMotion } from "@/lib/motion";
import { rooms } from "@/lib/rooms";

const COVER = 0.78;
const REVEAL = 0.82;

function destinationLabel(pathname: string) {
  if (pathname === "/") return "La locanda";
  if (pathname === "/camere") return "Camere";
  if (pathname === "/ristorante") return "Ristorante";
  if (pathname === "/cogne") return "Cogne";

  const room = rooms.find((item) => pathname === `/camere/${item.slug}`);
  return room?.name ?? "Locanda Grauson";
}

function internalHref(anchor: HTMLAnchorElement) {
  const raw = anchor.getAttribute("href");
  if (!raw || raw.startsWith("#")) return null;
  if (anchor.target === "_blank" || anchor.hasAttribute("download")) return null;

  try {
    const url = new URL(raw, window.location.href);
    if (url.origin !== window.location.origin) return null;
    return url;
  } catch {
    return null;
  }
}

/**
 * A full-screen alpine wipe between routes. Same-page hashes stay with Lenis;
 * the first visit never plays — only a click that actually changes the path.
 */
export function PageTransition() {
  const router = useRouter();
  const pathname = usePathname();
  const veil = useRef<HTMLDivElement>(null);
  const mark = useRef<HTMLDivElement>(null);
  const busy = useRef(false);
  const expected = useRef<string | null>(null);
  const [label, setLabel] = useState("");

  useEffect(() => {
    const root = veil.current;
    const brand = mark.current;
    if (!root || !brand) return;

    gsap.set(root, { autoAlpha: 0, clipPath: "inset(100% 0% 0% 0%)" });
    gsap.set(brand, { autoAlpha: 0, y: 18 });

    const cover = (href: string, nextPath: string) => {
      if (busy.current) return;
      busy.current = true;
      expected.current = nextPath;
      setLabel(destinationLabel(nextPath));
      setScrollLocked(true);
      document.documentElement.dataset.busy = "page";
      document
        .querySelector<HTMLButtonElement>('[aria-label="Menu di navigazione"] button')
        ?.click();

      const finish = () => router.push(href);

      if (reducedMotion()) {
        finish();
        return;
      }

      const tl = gsap.timeline({ onComplete: finish });
      tl.set(root, { visibility: "visible", pointerEvents: "auto", autoAlpha: 1 })
        .fromTo(
          root,
          { clipPath: "inset(100% 0% 0% 0%)" },
          { clipPath: "inset(0% 0% 0% 0%)", duration: COVER, ease: EASE },
        )
        .fromTo(
          brand,
          { autoAlpha: 0, y: 18 },
          { autoAlpha: 1, y: 0, duration: 0.55, ease: EASE },
          0.22,
        );
    };

    const onClick = (event: MouseEvent) => {
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const host = (event.target as HTMLElement | null)?.closest?.("a[href]");
      if (!(host instanceof HTMLAnchorElement)) return;

      const url = internalHref(host);
      if (!url) return;
      if (url.pathname === window.location.pathname) return;

      event.preventDefault();
      event.stopPropagation();
      cover(`${url.pathname}${url.search}${url.hash}`, url.pathname);
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [router]);

  useEffect(() => {
    if (!busy.current || expected.current !== pathname) return;

    const root = veil.current;
    const brand = mark.current;
    expected.current = null;

    const done = () => {
      busy.current = false;
      setScrollLocked(false);
      delete document.documentElement.dataset.busy;
      if (!root) return;
      gsap.set(root, { autoAlpha: 0, visibility: "hidden", pointerEvents: "none" });
    };

    if (reducedMotion() || !root || !brand) {
      done();
      return;
    }

    const tl = gsap.timeline({ delay: 0.08, onComplete: done });
    tl.to(brand, { autoAlpha: 0, y: -12, duration: 0.32, ease: "power2.in" }).to(
      root,
      { clipPath: "inset(0% 0% 100% 0%)", duration: REVEAL, ease: EASE },
      0.08,
    );
  }, [pathname]);

  return (
    <div
      ref={veil}
      data-page-veil
      aria-hidden
      className="on-dark invisible pointer-events-none fixed inset-0 z-[60] overflow-hidden bg-alpine-deep text-surface"
      style={{ clipPath: "inset(100% 0% 0% 0%)" }}
    >
      <div className="absolute inset-0">
        <div className="absolute inset-0 -left-[22%] w-[144%] sm:left-0 sm:w-full">
          <SeasonalImage
            slot="footer"
            sizes="100vw"
            unoptimized
            className="object-cover object-[center_40%]"
          />
        </div>
      </div>
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgb(27_36_29_/_0.42)_0%,rgb(27_36_29_/_0.24)_55%,rgb(27_36_29_/_0.16)_100%)]"
      />
      <div
        ref={mark}
        className="shell relative flex h-full flex-col items-center justify-center text-center"
      >
        <Wordmark size="lg" />
        <p className="hand mt-5 text-[1.35rem] leading-none text-surface/90 sm:text-[1.55rem]">
          {label}
        </p>
      </div>
    </div>
  );
}
