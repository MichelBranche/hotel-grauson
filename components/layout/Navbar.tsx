"use client";

import { ArrowRight, ChevronDown, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { NavbarLights } from "@/components/effects/NavbarLights";
import { useEffects } from "@/components/providers/EffectsProvider";
import { setScrollLocked } from "@/lib/lenis";
import { Wordmark } from "@/components/layout/Wordmark";
import { EASE, gsap, reducedMotion, useGSAP } from "@/lib/motion";
import { hotel, navLinks } from "@/lib/content";

const languages = [
  { code: "IT", label: "Italiano", available: true },
  { code: "EN", label: "English", available: false },
  { code: "FR", label: "Français", available: false },
];

/**
 * The glass migrates from the floating chips to the solid bar as you scroll, so
 * both states declare a blur radius rather than dropping the utility: a
 * `backdrop-blur` class that disappears snaps off at the start of the
 * transition and leaves the tint fading on its own. Same reason the borders and
 * shadows below always stay declared and only change colour.
 */
const glassOn = "[backdrop-filter:blur(14px)] [-webkit-backdrop-filter:blur(14px)]";
const glassOff = "[backdrop-filter:blur(0px)] [-webkit-backdrop-filter:blur(0px)]";

export function Navbar({ onPaper = false }: { onPaper?: boolean }) {
  const { lights } = useEffects();
  const pathname = usePathname();
  const prenotaHref = pathname.startsWith("/booking")
    ? "#cerca"
    : pathname.startsWith("/camere")
      ? "#prenota"
      : "/#prenota";
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  const overlay = useRef<HTMLDivElement>(null);
  const langWrap = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!langOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!langWrap.current?.contains(event.target as Node)) setLangOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [langOpen]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setLangOpen(false);
      if (menuOpen) {
        setMenuOpen(false);
        menuButton.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  // Mobile overlay choreography: panel wipes down, then the links rise in.
  useGSAP(
    () => {
      const el = overlay.current;
      if (!el) return;
      const pageBusy = document.documentElement.dataset.busy === "page";
      setScrollLocked(menuOpen || pageBusy);

      const items = el.querySelectorAll("[data-menu-item]");

      if (!menuOpen && pageBusy) {
        gsap.set(el, { visibility: "hidden", pointerEvents: "none", clipPath: "inset(0% 0% 100% 0%)" });
        gsap.set(items, { opacity: 0, y: 0 });
        return;
      }

      if (reducedMotion()) {
        gsap.set(el, { autoAlpha: menuOpen ? 1 : 0, clipPath: "none" });
        gsap.set(items, { opacity: 1, y: 0 });
        if (menuOpen) closeButton.current?.focus();
        return;
      }

      if (menuOpen) {
        gsap
          .timeline()
          .set(el, { visibility: "visible", pointerEvents: "auto" })
          .fromTo(
            el,
            { clipPath: "inset(0% 0% 100% 0%)" },
            { clipPath: "inset(0% 0% 0% 0%)", duration: 0.85, ease: EASE },
          )
          .fromTo(
            items,
            { opacity: 0, y: 34 },
            { opacity: 1, y: 0, duration: 0.9, stagger: 0.06, ease: EASE, clearProps: "transform" },
            0.22,
          )
          .add(() => closeButton.current?.focus(), 0.3);
      } else {
        gsap
          .timeline()
          .to(items, { opacity: 0, y: -14, duration: 0.3, stagger: 0.03, ease: "power2.in" })
          .to(el, { clipPath: "inset(0% 0% 100% 0%)", duration: 0.6, ease: EASE }, 0.1)
          .set(el, { visibility: "hidden", pointerEvents: "none" });
      }
    },
    { dependencies: [menuOpen] },
  );

  const onLight = scrolled || onPaper;
  const shellPad = onLight ? "pt-3" : "pt-6 sm:pt-8 lg:pt-9";
  const barSkin = onLight
    ? `bg-paper/85 px-3 py-2 shadow-[0_10px_40px_-26px_rgb(37_39_33_/_0.5)] [border-color:rgb(37_39_33_/_0.08)] [backdrop-filter:blur(22px)] [-webkit-backdrop-filter:blur(22px)]`
    : `mx-1 bg-paper/0 px-2 py-0 shadow-[0_10px_40px_-26px_rgb(37_39_33_/_0)] border-transparent sm:mx-2 sm:px-3 lg:mx-3 lg:px-5 ${glassOff}`;
  return (
    <header
      data-nav={onLight ? "solid" : "float"}
      className="pointer-events-none fixed inset-x-0 top-0 z-50"
    >
      <div
        className={`shell relative transition-[padding] duration-700 [transition-timing-function:var(--ease-skin)] ${shellPad}`}
      >
        <div
          className={`pointer-events-auto flex items-center justify-between gap-3 rounded-full border transition-all duration-700 [transition-timing-function:var(--ease-skin)] ${barSkin}`}
        >
          <Link
            href="/"
            aria-label={`${hotel.name}, torna all'inizio`}
            className="shrink-0 pl-1 sm:pl-2"
          >
            <Wordmark priority ink={onLight} />
          </Link>

          <nav aria-label="Navigazione principale" className="hidden lg:block">
            <ul className="relative isolate flex items-center gap-0.5 px-2 py-1.5">
              <span aria-hidden className="nav-chip" />
              {navLinks.map((link) => (
                <li key={link.href} className="relative">
                  <Link
                    href={link.href}
                    aria-current={isCurrent(pathname, link.href) ? "page" : undefined}
                    className="pill-nav-link"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-2">
            <div ref={langWrap} className="relative hidden sm:block">
              <button
                type="button"
                onClick={() => setLangOpen((open) => !open)}
                aria-expanded={langOpen}
                aria-haspopup="menu"
                aria-label="Cambia lingua, lingua attuale italiano"
                className={`relative isolate flex h-10 items-center gap-1.5 rounded-full px-4 text-[0.8125rem] font-medium text-ink transition-colors duration-500 [transition-timing-function:var(--ease-skin)] ${
                  onLight ? "hover:bg-[rgb(37_39_33_/_0.05)]" : ""
                }`}
              >
                <span aria-hidden className="nav-chip" />
                <span className="relative">IT</span>
                <ChevronDown
                  className={`relative size-3.5 transition-transform duration-500 ${langOpen ? "rotate-180" : ""}`}
                  strokeWidth={1.7}
                  aria-hidden
                />
              </button>

              {langOpen ? (
                <ul
                  role="menu"
                  className="absolute right-0 top-[calc(100%+0.5rem)] w-44 overflow-hidden rounded-[var(--radius-soft)] border border-[rgb(37_39_33_/_0.08)] bg-surface/97 p-1.5 shadow-[var(--shadow-lift)] backdrop-blur-xl"
                >
                  {languages.map((lang) => (
                    <li key={lang.code} role="none">
                      <button
                        type="button"
                        role="menuitem"
                        aria-current={lang.available || undefined}
                        aria-disabled={!lang.available}
                        onClick={() => lang.available && setLangOpen(false)}
                        className={`flex w-full items-center justify-between rounded-[12px] px-3 py-2 text-left text-[0.8125rem] transition-colors duration-300 ${
                          lang.available
                            ? "bg-[rgb(37_39_33_/_0.05)] text-ink"
                            : "text-muted hover:bg-[rgb(37_39_33_/_0.03)]"
                        }`}
                      >
                        <span>{lang.label}</span>
                        <span className="text-[0.625rem] tracking-[0.12em] uppercase opacity-70">
                          {lang.available ? lang.code : "presto"}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <Link
              href={prenotaHref}
              className="arrow-parent group hidden h-10 items-center gap-2 rounded-full bg-accent pr-4 pl-5 text-[0.8125rem] font-medium text-surface shadow-[0_12px_26px_-18px_rgb(38_50_41_/_0.9)] transition-colors duration-500 [transition-timing-function:var(--ease-out)] hover:bg-accent-hover sm:inline-flex"
            >
              Prenota
              <ArrowRight className="arrow-slide size-[15px]" strokeWidth={1.6} aria-hidden />
            </Link>

            <button
              ref={menuButton}
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-expanded={menuOpen}
              aria-controls="menu-mobile"
              className={`grid size-11 place-items-center rounded-full border transition-all duration-700 [transition-timing-function:var(--ease-skin)] lg:hidden ${
                onLight
                  ? `border-[rgb(37_39_33_/_0.12)] bg-surface text-ink ${glassOff}`
                  : `border-[rgb(255_255_255_/_0.3)] bg-surface/75 text-ink ${glassOn}`
              }`}
            >
              <span className="sr-only">Apri il menu</span>
              <Menu className="size-[18px]" strokeWidth={1.6} aria-hidden />
            </button>
          </div>
        </div>

        {/* Clipped to the bottom edge of the bar, so it rides along with it.
            Painted after the bar, so the clips read as hooked onto its edge.
            Only shown once the bar is solid: over the floating chips there is
            no edge to hang from. */}
        {lights ? <NavbarLights visible={onLight} /> : null}
      </div>

      {/* Mobile / tablet overlay */}
      <div
        id="menu-mobile"
        ref={overlay}
        role="dialog"
        aria-modal="true"
        aria-label="Menu di navigazione"
        inert={!menuOpen}
        className="on-dark invisible fixed inset-0 z-50 flex flex-col bg-alpine-deep text-surface lg:hidden"
        style={{ clipPath: "inset(0% 0% 100% 0%)" }}
      >
        <div className="shell flex items-start justify-between pt-4 sm:pt-5">
          <Link href="/" data-menu-item className="pt-1 text-surface" onClick={() => setMenuOpen(false)}>
            <Wordmark />
          </Link>
          <button
            ref={closeButton}
            data-menu-item
            type="button"
            onClick={() => setMenuOpen(false)}
            className="grid size-11 place-items-center rounded-full border border-[rgb(247_245_239_/_0.22)] text-surface transition-colors duration-500 hover:bg-[rgb(247_245_239_/_0.08)]"
          >
            <span className="sr-only">Chiudi il menu</span>
            <X className="size-[18px]" strokeWidth={1.6} aria-hidden />
          </button>
        </div>

        <nav aria-label="Navigazione mobile" className="shell flex flex-1 flex-col justify-center py-10">
          <ul className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <li key={link.href} data-menu-item>
                <Link
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  aria-current={isCurrent(pathname, link.href) ? "page" : undefined}
                  className="group flex items-baseline justify-between gap-4 border-b border-[rgb(247_245_239_/_0.1)] py-4"
                >
                  <span className="font-serif text-[2rem] leading-none tracking-[-0.015em] sm:text-[2.6rem]">
                    {link.label}
                  </span>
                  <ArrowRight
                    className="arrow-slide size-4 shrink-0 translate-y-[-0.35rem] opacity-45"
                    strokeWidth={1.5}
                    aria-hidden
                  />
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="shell flex flex-col gap-5 pb-10">
          <Link
            data-menu-item
            href={prenotaHref}
            onClick={() => setMenuOpen(false)}
            className="arrow-parent group flex h-[3.25rem] items-center justify-center gap-2 rounded-full bg-surface text-[0.875rem] font-medium text-ink"
          >
            Verifica disponibilità
            <ArrowRight className="arrow-slide size-4" strokeWidth={1.6} aria-hidden />
          </Link>
          <div data-menu-item className="flex flex-col gap-1 text-[0.8125rem] text-[rgb(247_245_239_/_0.62)]">
            <span>
              {hotel.address.street} · {hotel.address.postalCode} {hotel.address.city} ({hotel.address.province})
            </span>
            <a href={hotel.phoneHref} className="w-fit hover:text-surface">
              {hotel.phone}
            </a>
            <a href={`mailto:${hotel.email}`} className="w-fit hover:text-surface">
              {hotel.email}
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}

function isCurrent(pathname: string, href: string) {
  if (href === "/camere") return pathname === "/camere" || pathname.startsWith("/camere/");
  if (href === "/ristorante") return pathname === "/ristorante";
  if (href === "/cogne") return pathname === "/cogne";
  if (href === "/contatti") return pathname === "/contatti";
  return false;
}
