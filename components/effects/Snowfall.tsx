"use client";

import { useEffect, useRef } from "react";

import { reducedMotion } from "@/lib/motion";

type Flake = {
  x: number;
  y: number;
  /** Radius in CSS pixels; also drives speed and opacity, for depth. */
  r: number;
  fall: number;
  sway: number;
  swaySpeed: number;
  phase: number;
  alpha: number;
};

/** One flake per this many square pixels of viewport. */
const AREA_PER_FLAKE = 11000;
const MAX_FLAKES = 220;
const SPRITE_SIZE = 64;

/** Soft blurred dot, drawn once and then stamped per flake. */
function buildSprite() {
  const sprite = document.createElement("canvas");
  sprite.width = SPRITE_SIZE;
  sprite.height = SPRITE_SIZE;

  const ctx = sprite.getContext("2d");
  if (!ctx) return sprite;

  const half = SPRITE_SIZE / 2;
  const gradient = ctx.createRadialGradient(half, half, 0, half, half, half);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.35, "rgba(255,255,255,0.72)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, SPRITE_SIZE, SPRITE_SIZE);

  return sprite;
}

function buildFlake(width: number, height: number, fromTop: boolean): Flake {
  const r = 0.9 + Math.random() * 2.9;
  const depth = (r - 0.9) / 2.9;

  return {
    x: Math.random() * width,
    y: fromTop ? -Math.random() * height : Math.random() * height,
    r,
    fall: 14 + depth * 36,
    sway: 6 + Math.random() * 20,
    swaySpeed: 0.25 + Math.random() * 0.5,
    phase: Math.random() * Math.PI * 2,
    alpha: 0.32 + depth * 0.5,
  };
}

/**
 * Full-viewport snowfall.
 *
 * Canvas rather than DOM nodes: the same look as a few hundred blurred divs
 * without handing the compositor a few hundred blurred layers.
 */
export function Snowfall() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const sprite = buildSprite();
    const still = reducedMotion();

    let width = 0;
    let height = 0;
    let flakes: Flake[] = [];
    let frame = 0;
    let last = 0;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      for (const flake of flakes) {
        const size = flake.r * 6;
        ctx.globalAlpha = flake.alpha;
        ctx.drawImage(sprite, flake.x - size / 2, flake.y - size / 2, size, size);
      }
      ctx.globalAlpha = 1;
    };

    const tick = (now: number) => {
      // Clamped so a backgrounded tab does not resume with one huge step.
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      for (const flake of flakes) {
        flake.phase += flake.swaySpeed * dt;
        flake.x += Math.sin(flake.phase) * flake.sway * dt;
        flake.y += flake.fall * dt;

        if (flake.y - flake.r * 3 > height) {
          flake.y = -flake.r * 3;
          flake.x = Math.random() * width;
        }
        if (flake.x < -20) flake.x = width + 20;
        else if (flake.x > width + 20) flake.x = -20;
      }

      draw();
      frame = requestAnimationFrame(tick);
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.min(MAX_FLAKES, Math.round((width * height) / AREA_PER_FLAKE));
      flakes = Array.from({ length: count }, () => buildFlake(width, height, false));

      if (still) draw();
    };

    resize();
    window.addEventListener("resize", resize);

    if (!still) {
      last = performance.now();
      frame = requestAnimationFrame(tick);
    }

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[45] h-full w-full"
    />
  );
}
