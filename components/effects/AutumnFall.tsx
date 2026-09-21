"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";

import { reducedMotion } from "@/lib/motion";

import "./AutumnFall.css";

const INSIDE_COUNT = 24;
const STRAY_COUNT = 4;

/** The warm maples out of Yusuke Nakaya's compiled autumn palette. */
const PALETTE = [
  "#b23225",
  "#c55d3a",
  "#9f634e",
  "#ac273a",
  "#bf5c4c",
  "#d25734",
  "#8a3d1c",
  "#b7334a",
  "#c46b28",
  "#7a2129",
  "#a85a24",
  "#6d5036",
];

type LeafStyle = CSSProperties & Record<string, string>;

function unit(i: number, salt: number) {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/** Leaves that stay in the photograph: small, slow, clipped by the frame. */
const INSIDE_LEAVES: LeafStyle[] = Array.from({ length: INSIDE_COUNT }, (_, i) => ({
  "--top": `${-12 + unit(i, 1) * 16}%`,
  "--left": `${3 + unit(i, 2) * 90}%`,
  "--ox": `${Math.round(-60 + unit(i, 3) * 120)}px`,
  "--oy": `${Math.round(-70 + unit(i, 4) * 140)}px`,
  "--dur": `${Math.round(10_500 + unit(i, 5) * 6_000)}ms`,
  "--delay": `${Math.round(unit(i, 6) * 2_600)}ms`,
  "--scale": (0.4 + unit(i, 7) * 0.34).toFixed(3),
  "--rx": `${Math.round(unit(i, 8) * 360)}deg`,
  "--ry": `${Math.round(unit(i, 9) * 360)}deg`,
  "--rz": `${Math.round(unit(i, 10) * 360)}deg`,
  "--c": PALETTE[i % PALETTE.length],
}));

/**
 * The near-camera ones: bigger, faster, and drifting sideways off the edge, so
 * every so often a leaf crosses the frame instead of respecting it. Delays are
 * spread across the loop to keep them occasional rather than a wave.
 */
const STRAY_LEAVES: LeafStyle[] = Array.from({ length: STRAY_COUNT }, (_, i) => {
  const fromLeft = i % 2 === 0;
  const drift = (6 + unit(i, 11) * 10) * (fromLeft ? -1 : 1);

  return {
    "--top": `${8 + unit(i, 12) * 22}vh`,
    "--left": fromLeft ? `${2 + unit(i, 13) * 16}%` : `${82 + unit(i, 13) * 14}%`,
    "--dx": `${drift.toFixed(1)}cqw`,
    "--ox": `${Math.round(-90 + unit(i, 14) * 180)}px`,
    "--oy": `${Math.round(-110 + unit(i, 15) * 220)}px`,
    "--dur": `${(0.86 + unit(i, 16) * 0.32).toFixed(3)}`,
    "--delay": `${Math.round(800 + i * 5_200 + unit(i, 17) * 1_800)}ms`,
    "--spin": `${Math.round(10_000 + unit(i, 22) * 5_000)}ms`,
    "--scale": (0.85 + unit(i, 18) * 0.42).toFixed(3),
    "--rx": `${Math.round(unit(i, 19) * 360)}deg`,
    "--ry": `${Math.round(unit(i, 20) * 360)}deg`,
    "--rz": `${Math.round(unit(i, 21) * 360)}deg`,
    "--c": PALETTE[(i * 5) % PALETTE.length],
  };
});

const FAN = Array.from({ length: 7 }, (_, petal) => <div key={petal} className="leave" />);

/** Fall as soon as autumn is on, even while the hero is still at rest. */
function useAutumnFall() {
  const [falling, setFalling] = useState(false);

  useEffect(() => {
    if (reducedMotion()) return;
    setFalling(true);
  }, []);

  return falling;
}

function Maples({ layer, leaves }: { layer: "clipped" | "loose"; leaves: LeafStyle[] }) {
  const falling = useAutumnFall();
  const layerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (layer !== "loose") return;

    const el = layerRef.current;
    if (!el) return;

    const apply = () => {
      const travel = Math.max(el.clientHeight, 1);
      el.style.setProperty("--fall", `${Math.round(travel / 0.084)}ms`);
    };

    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(el);
    return () => observer.disconnect();
  }, [layer]);

  return (
    <div
      ref={layerRef}
      data-autumn-fall={layer}
      aria-hidden
      className={falling ? "is-falling" : undefined}
    >
      {leaves.map((leaf, index) => (
        <div key={index} className="maple" style={leaf}>
          <div className="leave-wrap">{FAN}</div>
        </div>
      ))}
    </div>
  );
}

/** Maple fall over the hero photograph, behind the headline. */
export function AutumnFall() {
  return <Maples layer="clipped" leaves={INSIDE_LEAVES} />;
}

/**
 * The handful of leaves allowed out of the frame. Portaled onto `#contenuto`
 * so they keep falling over the page and only clip when they reach the footer.
 */
export function AutumnStrays() {
  const [root, setRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setRoot(document.getElementById("contenuto"));
  }, []);

  if (!root) return null;

  return createPortal(<Maples layer="loose" leaves={STRAY_LEAVES} />, root);
}
