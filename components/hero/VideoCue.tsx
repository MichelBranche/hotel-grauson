"use client";

import { Play, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { setScrollLocked } from "@/lib/lenis";
import { EASE, gsap, reducedMotion, useGSAP } from "@/lib/motion";

type VideoCueProps = {
  /** Wire a real asset or embed URL here when the film is delivered. */
  src?: string;
  poster: string;
  label?: string;
};

/**
 * Play affordance plus lightbox. Without a `src` the lightbox shows the
 * poster frame and a short note, so nothing ever looks broken.
 */
export function VideoCue({ src, poster, label = "Guarda il video" }: VideoCueProps) {
  const [open, setOpen] = useState(false);
  /* The overlay is created on first open — never during SSR — and then kept
     mounted so the closing transition can play out. */
  const [everOpened, setEverOpened] = useState(false);
  const dialog = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && open) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useGSAP(
    () => {
      const el = dialog.current;
      if (!el) return;
      setScrollLocked(open);

      if (open) {
        gsap.set(el, { visibility: "visible", pointerEvents: "auto" });
        if (!reducedMotion()) {
          gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: EASE });
          gsap.fromTo(
            el.querySelector("[data-video-panel]"),
            { opacity: 0, y: 26, scale: 0.985 },
            { opacity: 1, y: 0, scale: 1, duration: 0.9, ease: EASE, clearProps: "transform" },
          );
        } else {
          gsap.set(el, { opacity: 1 });
        }
        closeButton.current?.focus();
      } else {
        gsap.to(el, {
          opacity: 0,
          duration: reducedMotion() ? 0 : 0.35,
          onComplete: () => gsap.set(el, { visibility: "hidden", pointerEvents: "none" }),
        });
        trigger.current?.focus({ preventScroll: true });
      }
    },
    { dependencies: [open, everOpened] },
  );

  /* Portalled to <body>: any transformed ancestor (GSAP animates the hero CTA)
     would otherwise become the containing block for this fixed overlay. */
  const overlay = (
    <div
      ref={dialog}
      role="dialog"
      aria-modal="true"
      aria-label="Video della Locanda Grauson"
      inert={!open}
      className="on-dark invisible fixed inset-0 z-[70] flex items-center justify-center bg-[rgb(20_24_18_/_0.82)] p-[var(--gutter)] opacity-0 backdrop-blur-md"
      onClick={(event) => {
        if (event.target === event.currentTarget) setOpen(false);
      }}
    >
      <div
        data-video-panel
        className="relative w-full max-w-4xl overflow-hidden rounded-[var(--radius-panel)] bg-alpine-deep shadow-[var(--shadow-lift)]"
      >
        <button
          ref={closeButton}
          type="button"
          onClick={() => setOpen(false)}
          className="absolute top-3 right-3 z-10 grid size-10 place-items-center rounded-full bg-[rgb(20_24_18_/_0.55)] text-surface backdrop-blur-md transition-colors duration-400 hover:bg-[rgb(20_24_18_/_0.8)]"
        >
          <span className="sr-only">Chiudi il video</span>
          <X className="size-[18px]" strokeWidth={1.6} aria-hidden />
        </button>

        <div className="relative aspect-video w-full">
          {src ? (
            <video className="h-full w-full object-cover" src={src} poster={poster} controls autoPlay playsInline />
          ) : (
            <>
              <Image
                src={poster}
                alt=""
                fill
                sizes="(max-width: 1024px) 92vw, 60rem"
                className="object-cover opacity-55"
              />
              <div className="absolute inset-0 grid place-items-center bg-gradient-to-t from-[rgb(20_24_18_/_0.85)] to-transparent px-8 text-center">
                <p className="max-w-md text-surface">
                  <span className="display-md block">Il film della locanda</span>
                  <span className="mt-3 block text-[0.875rem] leading-relaxed text-[rgb(247_245_239_/_0.7)]">
                    Stiamo girando tra le stanze, la cucina e i sentieri di Gimillan. Sarà qui con la
                    prossima stagione estiva.
                  </span>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        ref={trigger}
        type="button"
        onClick={() => {
          setEverOpened(true);
          setOpen(true);
        }}
        className="group flex items-center gap-3 rounded-full py-1 pr-4 text-[0.8125rem] font-medium text-surface"
      >
        <span className="grid size-[2.625rem] shrink-0 place-items-center rounded-full border border-[rgb(247_245_239_/_0.55)] bg-[rgb(247_245_239_/_0.12)] backdrop-blur-md transition-all duration-500 [transition-timing-function:var(--ease-out)] group-hover:bg-surface group-hover:text-alpine">
          <Play className="size-[13px] translate-x-[1px] fill-current" strokeWidth={0} aria-hidden />
        </span>
        <span className="relative">
          {label}
          <span className="absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 bg-current transition-transform duration-500 [transition-timing-function:var(--ease-out)] group-hover:scale-x-100" />
        </span>
      </button>

      {everOpened ? createPortal(overlay, document.body) : null}
    </>
  );
}
