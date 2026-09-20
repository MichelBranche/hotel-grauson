"use client";

import Lenis from "lenis";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { PageTransition } from "@/components/layout/PageTransition";
import { getLenis, setLenis } from "@/lib/lenis";
import { ScrollTrigger, gsap, reducedMotion } from "@/lib/motion";

function hashTarget(href: string | null) {
  if (!href) return null;
  const url = new URL(href, window.location.href);
  if (url.pathname !== window.location.pathname) return null;
  if (!url.hash) return null;
  return document.querySelector(url.hash);
}

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith("/pms") || reducedMotion()) {
      ScrollTrigger.refresh();
      return;
    }

    const instance = new Lenis({
      lerp: 0.085,
      wheelMultiplier: 0.95,
      touchMultiplier: 1.4,
      smoothWheel: true,
      autoRaf: false,
    });
    setLenis(instance);

    const onScroll = () => ScrollTrigger.update();
    instance.on("scroll", onScroll);

    const raf = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    const onClick = (event: MouseEvent) => {
      const link = (event.target as HTMLElement | null)?.closest?.("a[href]");
      if (!(link instanceof HTMLAnchorElement)) return;
      const target = hashTarget(link.getAttribute("href"));
      if (!target) return;
      event.preventDefault();
      instance.scrollTo(target as HTMLElement, { offset: -110, duration: 1.4 });
    };
    document.addEventListener("click", onClick);

    const refresh = () => ScrollTrigger.refresh();
    document.fonts?.ready.then(refresh);
    window.addEventListener("load", refresh);

    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("load", refresh);
      gsap.ticker.remove(raf);
      instance.destroy();
      setLenis(null);
    };
  }, [pathname]);

  useEffect(() => {
    const hash = window.location.hash;
    const target = hash ? document.querySelector(hash) : null;
    const instance = getLenis();

    if (instance) {
      if (target) instance.scrollTo(target as HTMLElement, { offset: -110, duration: 1.15 });
      else instance.scrollTo(0, { immediate: true });
    } else if (!target) {
      window.scrollTo(0, 0);
    }

    const id = window.requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => window.cancelAnimationFrame(id);
  }, [pathname]);

  if (pathname.startsWith("/pms")) {
    return <>{children}</>;
  }

  return (
    <>
      <PageTransition />
      {children}
    </>
  );
}
