import type Lenis from "lenis";

let lenis: Lenis | null = null;

export function getLenis() {
  return lenis;
}

export function setLenis(instance: Lenis | null) {
  lenis = instance;
}

/** Locks page scrolling (menu, page veil) with or without Lenis. */
export function setScrollLocked(locked: boolean) {
  if (lenis) {
    if (locked) lenis.stop();
    else lenis.start();
  }
  document.documentElement.classList.toggle("lenis-stopped", locked);
  document.body.style.overflow = locked && !lenis ? "hidden" : "";
}
