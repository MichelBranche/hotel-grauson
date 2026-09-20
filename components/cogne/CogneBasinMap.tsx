"use client";

import type { ValleyId } from "@/lib/cogne";
import { valleys } from "@/lib/cogne";

const valleyClass = (id: ValleyId, active: ValleyId | null) => {
  const on = active === null || active === id;
  return `transition-[opacity,stroke-width] duration-500 [transition-timing-function:var(--ease-out)] ${
    on ? "opacity-100" : "opacity-30"
  }`;
};

export function CogneBasinMap({
  active,
  onSelect,
}: {
  active: ValleyId | null;
  onSelect: (id: ValleyId) => void;
}) {
  return (
    <svg
      viewBox="0 0 800 560"
      role="img"
      aria-labelledby="bacino-caption"
      className="h-auto w-full"
    >
      <title id="bacino-caption">Carta schematica del bacino di Cogne, con Gimillan e le quattro valli</title>

      <defs>
        <linearGradient id="cogne-ridge" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(70 82 72 / 0.14)" />
          <stop offset="100%" stopColor="rgb(70 82 72 / 0.02)" />
        </linearGradient>
      </defs>

      <path
        d="M40 210 C 120 90, 280 40, 420 70 C 560 100, 700 160, 760 250 L 760 520 L 40 520 Z"
        fill="url(#cogne-ridge)"
      />

      <g fill="none" stroke="rgb(37 39 33 / 0.16)" strokeWidth="1.25" strokeLinejoin="round">
        <path d="M70 430 C 160 390, 210 340, 250 300 C 280 270, 300 240, 340 210" />
        <path d="M180 500 C 220 455, 250 410, 270 370" />
        <path d="M620 80 C 580 120, 560 150, 530 175" />
        <path d="M720 430 C 680 400, 640 385, 600 375" />
      </g>

      <g fill="none" stroke="rgb(70 96 118 / 0.72)" strokeWidth="2.4" strokeLinecap="round">
        <path d="M48 188 C 130 210, 230 250, 338 292" />
        <path
          className={valleyClass("valnontey", active)}
          d="M210 508 C 240 470, 258 430, 278 392 C 300 350, 318 318, 338 292"
        />
        <path
          className={valleyClass("valeille", active)}
          d="M690 478 C 640 440, 590 400, 530 378 C 470 352, 400 318, 338 292"
        />
        <path
          className={valleyClass("grauson", active)}
          d="M560 72 C 520 110, 490 140, 455 168 C 410 210, 370 255, 338 292"
        />
      </g>

      <g fill="none" stroke="rgb(37 39 33 / 0.38)" strokeWidth="1.6" strokeLinecap="round" strokeDasharray="5 7">
        <path className={valleyClass("paese", active)} d="M338 292 C 380 250, 415 205, 452 168" />
        <path className={valleyClass("grauson", active)} d="M452 168 C 490 148, 515 128, 548 98" />
        <path className={valleyClass("valnontey", active)} d="M338 292 C 310 340, 290 380, 272 418" />
        <path className={valleyClass("valeille", active)} d="M338 292 C 400 330, 470 360, 528 378" />
      </g>

      {valleys.map((valley) => {
        const points: Record<ValleyId, { x: number; y: number }> = {
          grauson: { x: 548, y: 92 },
          paese: { x: 338, y: 292 },
          valnontey: { x: 268, y: 428 },
          valeille: { x: 538, y: 382 },
        };
        const p = points[valley.id];
        const selected = active === valley.id;
        return (
          <g key={valley.id} className={valleyClass(valley.id, active)}>
            <circle
              cx={p.x}
              cy={p.y}
              r={selected ? 11 : 7}
              fill={selected ? "var(--alpine)" : "var(--paper)"}
              stroke="var(--ink)"
              strokeWidth="1.5"
            />
          </g>
        );
      })}

      <g>
        <circle cx="452" cy="168" r="13" fill="var(--accent)" />
        <circle cx="452" cy="168" r="5" fill="var(--surface)" />
        <text
          x="478"
          y="148"
          fill="rgb(37 39 33 / 0.55)"
          style={{ fontFamily: "var(--font-hand)", fontSize: 22 }}
        >
          la locanda
        </text>
      </g>

      <g
        fill="currentColor"
        className="font-sans text-[11px] tracking-[0.14em] uppercase"
        style={{ fontFamily: "var(--font-sans)" }}
      >
        <text x="548" y="78" textAnchor="middle" fill="rgb(37 39 33 / 0.55)">
          Grauson
        </text>
        <text x="268" y="456" textAnchor="middle" fill="rgb(37 39 33 / 0.55)">
          Valnontey
        </text>
        <text x="590" y="400" fill="rgb(37 39 33 / 0.55)">
          Lillaz · Valeille
        </text>
        <text x="338" y="318" textAnchor="middle" fill="rgb(37 39 33 / 0.72)">
          Cogne
        </text>
        <text x="478" y="176" fill="rgb(37 39 33 / 0.82)">
          Gimillan
        </text>
        <text x="64" y="176" fill="rgb(37 39 33 / 0.4)">
          verso Aosta
        </text>
        <text x="168" y="528" fill="rgb(37 39 33 / 0.4)">
          Gran Paradiso
        </text>
      </g>

      <g transform="translate(48 48)" aria-hidden>
        <line x1="0" y1="28" x2="0" y2="0" stroke="currentColor" strokeWidth="1.2" />
        <polygon points="0,-2 -4,8 4,8" fill="currentColor" />
        <text x="8" y="8" fill="currentColor" style={{ fontSize: 10, letterSpacing: "0.16em" }}>
          N
        </text>
      </g>

      {valleys.map((valley) => {
        const hit: Record<ValleyId, string> = {
          grauson: "M430 40 L640 40 L640 190 L430 190 Z",
          paese: "M270 230 L410 230 L410 350 L270 350 Z",
          valnontey: "M170 340 L330 340 L330 530 L170 530 Z",
          valeille: "M470 330 L720 330 L720 510 L470 510 Z",
        };
        return (
          <path
            key={`hit-${valley.id}`}
            d={hit[valley.id]}
            fill="transparent"
            className="cursor-pointer"
            onClick={() => onSelect(valley.id)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelect(valley.id);
              }
            }}
            role="button"
            tabIndex={0}
            aria-pressed={active === valley.id}
            aria-label={valley.name}
          />
        );
      })}
    </svg>
  );
}
