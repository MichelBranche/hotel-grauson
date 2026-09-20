"use client";

import { useEffect, useRef } from "react";

import { reducedMotion } from "@/lib/motion";

type Point = {
  x: number;
  y: number;
  /** Previous position: velocity is the gap between the two (Verlet). */
  px: number;
  py: number;
  pinned: boolean;
  tilt: number;
  /** 1 hangs down, -1 points up, alternating along the string. */
  facing: 1 | -1;
  brightness: number;
};

type Stick = { a: Point; b: Point; length: number };

const CANVAS_HEIGHT = 136;
/** How far the canvas rides up onto the bar, so the clips bite into its edge. */
const OVERLAP = 11;
/** The bar's bottom edge in canvas space: where the clips screw in. */
const ANCHOR_Y = OVERLAP;
/** Clears the pill's rounded ends, where there is no flat edge to clip onto. */
const END_INSET = 48;
const SWAG_TARGET = 215;
const SEGMENTS_PER_SWAG = 7;
const SLACK = 1.17;
const GRAVITY = 1500;
const DAMPING = 0.985;
const STEP = 1 / 60;
const RELAX = 3;
const PATTERN_SECONDS = 15;

const CORD = "rgba(26,32,24,0.82)";
const CLIP = "rgba(26,32,24,0.9)";
const BULBS: [number, number, number][] = [
  [243, 205, 130],
  [231, 154, 58],
  [207, 91, 70],
  [134, 161, 115],
  [246, 240, 226],
];

const GLOW_SIZE = 72;

function buildGlow([r, g, b]: [number, number, number]) {
  const sprite = document.createElement("canvas");
  sprite.width = GLOW_SIZE;
  sprite.height = GLOW_SIZE;

  const ctx = sprite.getContext("2d");
  if (!ctx) return sprite;

  const half = GLOW_SIZE / 2;
  const gradient = ctx.createRadialGradient(half, half, 0, half, half, half);
  gradient.addColorStop(0, `rgba(${r},${g},${b},0.95)`);
  gradient.addColorStop(0.28, `rgba(${r},${g},${b},0.4)`);
  gradient.addColorStop(1, `rgba(${r},${g},${b},0)`);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, GLOW_SIZE, GLOW_SIZE);

  return sprite;
}

/** Pattern set, cycled so the string never settles into one loop. */
const patterns = [
  (index: number, time: number) => Math.sin(index * 0.7 - time * 2.4) * 0.5 + 0.5,
  (index: number, time: number) => (index % 2 === 0 ? 1 : 0) * 0.85 + Math.sin(time * 2) * 0.15 + 0.1,
  (index: number, time: number) => Math.sin(time * 1.1 + index * 0.18) * 0.45 + 0.55,
];

/**
 * Garland clipped under the navbar.
 *
 * Verlet rope: the pinned points sit on the bar's own bottom edge, each under a
 * clip, and every segment is a little longer than the gap it spans, so gravity
 * settles the string into even swags between them. The pointer nudges the
 * nearest points and the constraints pull them back.
 *
 * `visible` freezes the simulation instead of unmounting, so the last frame
 * stays on the canvas while it fades out and the string is already hanging when
 * it fades back in.
 */
export function NavbarLights({ visible }: { visible: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const visibleRef = useRef(visible);

  useEffect(() => {
    visibleRef.current = visible;
  }, [visible]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const glows = BULBS.map(buildGlow);
    const still = reducedMotion();

    let width = 0;
    let points: Point[] = [];
    let sticks: Stick[] = [];
    let frame = 0;
    let last = 0;
    let elapsed = 0;
    let carry = 0;

    const build = () => {
      points = [];
      sticks = [];

      const span = Math.max(SWAG_TARGET, width - END_INSET * 2);
      // Rounding up keeps narrow bars from hanging in one deep swag.
      const swags = Math.max(1, Math.ceil(span / SWAG_TARGET));
      const segments = swags * SEGMENTS_PER_SWAG;
      const segmentWidth = span / segments;

      for (let i = 0; i <= segments; i += 1) {
        const x = END_INSET + segmentWidth * i;
        const point: Point = {
          x,
          y: ANCHOR_Y,
          px: x,
          py: ANCHOR_Y,
          pinned: i % SEGMENTS_PER_SWAG === 0,
          tilt: (Math.random() * 2 - 1) * 0.3,
          facing: i % 2 === 0 ? 1 : -1,
          brightness: 0,
        };
        points.push(point);

        if (i > 0) {
          // A touch of variation per segment so no two swags hang identically.
          const slack = SLACK * (0.97 + Math.random() * 0.06);
          sticks.push({ a: points[i - 1], b: point, length: segmentWidth * slack });
        }
      }
    };

    const simulate = () => {
      for (const p of points) {
        if (p.pinned) continue;
        const vx = (p.x - p.px) * DAMPING;
        const vy = (p.y - p.py) * DAMPING;
        p.px = p.x;
        p.py = p.y;
        p.x += vx;
        p.y += vy + GRAVITY * STEP * STEP;
      }

      for (let pass = 0; pass < RELAX; pass += 1) {
        for (const stick of sticks) {
          const dx = stick.b.x - stick.a.x;
          const dy = stick.b.y - stick.a.y;
          const dist = Math.hypot(dx, dy) || 0.0001;
          // Only pull when stretched: a slack segment should stay slack.
          if (dist <= stick.length) continue;

          const shift = ((dist - stick.length) / dist) * 0.5;
          const ox = dx * shift;
          const oy = dy * shift;

          if (!stick.a.pinned) {
            stick.a.x += ox;
            stick.a.y += oy;
          }
          if (!stick.b.pinned) {
            stick.b.x -= ox;
            stick.b.y -= oy;
          }
        }
      }
    };

    /** Cable clip hooked over the bar's edge, holding the cord at a pin. */
    const drawClip = (x: number) => {
      ctx.fillStyle = CLIP;
      ctx.fillRect(x - 2.6, ANCHOR_Y - 8, 5.2, 10);

      // Rounded caps top and bottom: a little tab, not a bare rectangle.
      ctx.beginPath();
      ctx.ellipse(x, ANCHOR_Y - 8, 2.6, 2.2, 0, 0, Math.PI * 2);
      ctx.ellipse(x, ANCHOR_Y + 2.4, 4.2, 3, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(255,255,255,0.22)";
      ctx.fillRect(x - 1.1, ANCHOR_Y - 7, 1.2, 8);
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, CANVAS_HEIGHT);

      // Everything but the clips stays below the bar's edge: the canvas paints
      // over the bar, and glow bleeding onto it would fog the nav labels.
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, ANCHOR_Y, width, CANVAS_HEIGHT - ANCHOR_Y);
      ctx.clip();

      ctx.strokeStyle = CORD;
      ctx.lineWidth = 1.7;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length - 1; i += 1) {
        const p = points[i];
        const next = points[i + 1];
        ctx.quadraticCurveTo(p.x, p.y, (p.x + next.x) / 2, (p.y + next.y) / 2);
      }
      ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
      ctx.stroke();

      for (let i = 0; i < points.length; i += 1) {
        const p = points[i];
        // The clips hold the cord here; bulbs hang in the swags between them.
        if (p.pinned) continue;

        const prev = points[i - 1] ?? p;
        const next = points[i + 1] ?? p;
        const tangent = Math.atan2(next.y - prev.y, next.x - prev.x);
        const angle = tangent + (p.facing === 1 ? Math.PI / 2 : -Math.PI / 2) + p.tilt;

        const [r, g, b] = BULBS[i % BULBS.length];
        const lit = p.brightness;
        const shade = 0.34 + lit * 0.66;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(angle);

        ctx.fillStyle = CORD;
        ctx.fillRect(-2.5, 0, 5, 5);

        ctx.fillStyle = `rgb(${Math.round(r * shade)},${Math.round(g * shade)},${Math.round(
          b * shade,
        )})`;
        ctx.beginPath();
        ctx.ellipse(0, 10, 4.2, 5.6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Glow is stamped in screen space so the bulb rotation cannot squash it.
        const bulbX = p.x + Math.cos(angle) * 10;
        const bulbY = p.y + Math.sin(angle) * 10;

        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = 0.25 + lit * 0.75;
        ctx.drawImage(
          glows[i % glows.length],
          bulbX - GLOW_SIZE / 2,
          bulbY - GLOW_SIZE / 2,
          GLOW_SIZE,
          GLOW_SIZE,
        );
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = "source-over";
      }

      ctx.restore();

      // Drawn last and unclipped, so each clip sits on top of the bar's edge.
      for (const p of points) {
        if (p.pinned) drawClip(p.x);
      }
    };

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);

      if (!visibleRef.current) {
        // Frozen while hidden: the last frame stays up for the fade-out.
        last = now;
        carry = 0;
        return;
      }

      carry += Math.min((now - last) / 1000, 0.1);
      last = now;

      while (carry >= STEP) {
        simulate();
        elapsed += STEP;
        carry -= STEP;
      }

      const pattern = patterns[Math.floor(elapsed / PATTERN_SECONDS) % patterns.length];
      for (let i = 0; i < points.length; i += 1) {
        points[i].brightness = Math.min(1, Math.max(0, pattern(i, elapsed)));
      }

      draw();
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(CANVAS_HEIGHT * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      build();

      // Settle the rope before it is ever shown, so it fades in already hanging.
      for (let i = 0; i < 260; i += 1) simulate();

      if (still) {
        for (const p of points) p.brightness = 0.8;
        draw();
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!visibleRef.current) return;

      const rect = canvas.getBoundingClientRect();
      const mx = event.clientX - rect.left;
      const my = event.clientY - rect.top;

      for (const p of points) {
        if (p.pinned) continue;
        const dx = mx - p.x;
        const dy = my - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 44 || dist === 0) continue;
        // Shifting the previous position pushes the point away from the cursor.
        p.px += (dx / dist) * 1.6;
        p.py += (dy / dist) * 1.6;
      }
    };

    resize();
    window.addEventListener("resize", resize);

    if (!still) {
      window.addEventListener("pointermove", onPointerMove);
      last = performance.now();
      frame = requestAnimationFrame(tick);
    }

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    /* The wrapper does the stretching: a bare canvas is a replaced element and
       would keep its intrinsic width instead of spanning the bar. */
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-x-[var(--gutter)] transition-opacity duration-700 [transition-timing-function:var(--ease-skin)] ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      style={{ height: CANVAS_HEIGHT, top: `calc(100% - ${OVERLAP}px)` }}
    >
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}
