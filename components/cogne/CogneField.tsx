"use client";

import { useMemo, useState } from "react";

import { CogneBasinMap } from "@/components/cogne/CogneBasinMap";
import { Reveal } from "@/components/ui/Reveal";
import {
  gradeLabel,
  hikingLink,
  osmEmbed,
  osmLink,
  trails,
  type Trail,
  type ValleyId,
  valleys,
} from "@/lib/cogne";
import { hotel } from "@/lib/content";

export function CogneField() {
  const [valley, setValley] = useState<ValleyId | null>(null);

  const visible = useMemo(
    () => (valley ? trails.filter((trail) => trail.valley === valley) : trails),
    [valley],
  );

  const activeValley = valleys.find((item) => item.id === valley);

  return (
    <>
      <section id="carta" aria-labelledby="carta-title" className="shell mt-5 scroll-mt-28 sm:mt-7">
        <Reveal className="rounded-[var(--radius-panel)] bg-surface px-5 py-10 shadow-[var(--shadow-soft)] sm:px-10 sm:py-14 lg:px-14">
          <div data-reveal className="max-w-[40rem]">
            <p className="eyebrow flex items-center gap-3 text-muted">
              La carta
              <span aria-hidden className="h-px w-12 bg-[rgb(37_39_33_/_0.16)]" />
            </p>
            <h2 id="carta-title" className="display-lg mt-5">
              Mappa del bacino
            </h2>
            <p className="lede mt-5">
              Schema delle quattro valli intorno a Cogne. Selezionare una valle per filtrare i
              sentieri.
            </p>
          </div>

          <div
            data-reveal
            className="mt-10 overflow-hidden rounded-[var(--radius-card)] border border-[rgb(37_39_33_/_0.08)] bg-paper"
          >
            <CogneBasinMap
              active={valley}
              onSelect={(id) => setValley((current) => (current === id ? null : id))}
            />
          </div>

          <div
            data-reveal
            className="mt-6 flex flex-wrap items-center justify-between gap-3 text-[0.8125rem] text-muted"
          >
            <p>
              <span className="inline-block size-2 rounded-full bg-accent align-middle" />
              <span className="ml-2">{hotel.name}, {hotel.hamlet}</span>
            </p>
            {activeValley ? (
              <p className="max-w-[36rem] text-ink">{activeValley.line}</p>
            ) : (
              <p>Tocca una valle sulla carta.</p>
            )}
          </div>

          <div
            data-reveal
            className="relative mt-10 overflow-hidden rounded-[var(--radius-card)] bg-alpine-deep"
          >
            <div className="aspect-[16/11] w-full sm:aspect-[16/9]">
              <iframe
                title="Carta OpenStreetMap del bacino di Cogne, con la Locanda Grauson"
                src={osmEmbed}
                className="h-full w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 text-[0.75rem] text-surface/60">
              <p>OpenStreetMap · il punto è la locanda</p>
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                <a
                  href={osmLink}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="underline decoration-surface/25 underline-offset-4 hover:text-surface hover:decoration-surface"
                >
                  Mappa intera
                </a>
                <a
                  href={hikingLink}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="underline decoration-surface/25 underline-offset-4 hover:text-surface hover:decoration-surface"
                >
                  Sentieri segnati
                </a>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <section id="sentieri" aria-labelledby="sentieri-title" className="shell mt-5 scroll-mt-28 sm:mt-7">
        <Reveal>
          <div data-reveal className="max-w-[40rem] px-1">
            <p className="eyebrow flex items-center gap-3 text-muted">
              I sentieri
              <span aria-hidden className="h-px w-12 bg-[rgb(37_39_33_/_0.16)]" />
            </p>
            <h2 id="sentieri-title" className="display-lg mt-5">
              Sentieri ufficiali
            </h2>
            <p className="lede mt-5">
              Tempi e dislivelli: Ufficio del Turismo di Cogne, 2024. Con neve o maltempo i
              percorsi possono essere chiusi.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-2 px-1">
            <FilterChip
              label="Tutti"
              pressed={valley === null}
              onClick={() => setValley(null)}
            />
            {valleys.map((item) => (
              <FilterChip
                key={item.id}
                label={item.short}
                pressed={valley === item.id}
                onClick={() => setValley(item.id === valley ? null : item.id)}
              />
            ))}
          </div>

          <ol data-reveal className="mt-10 grid gap-3 sm:gap-4 lg:grid-cols-2">
            {visible.map((trail) => (
              <li key={trail.id}>
                <TrailSlip trail={trail} />
              </li>
            ))}
          </ol>
        </Reveal>
      </section>
    </>
  );
}

function FilterChip({
  label,
  pressed,
  onClick,
}: {
  label: string;
  pressed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`rounded-full px-3.5 py-1.5 text-[0.75rem] tracking-[0.04em] transition-colors duration-400 [transition-timing-function:var(--ease-out)] ${
        pressed
          ? "bg-alpine text-surface"
          : "bg-surface text-muted hover:text-ink"
      }`}
    >
      {label}
    </button>
  );
}

function TrailSlip({ trail }: { trail: Trail }) {
  return (
    <article
      id={trail.id}
      className="flex h-full flex-col rounded-[var(--radius-card)] bg-surface px-6 py-7 shadow-[var(--shadow-soft)] sm:px-8 sm:py-8"
    >
      <div className="flex items-start justify-between gap-4">
        <p className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-full border border-[rgb(37_39_33_/_0.16)] text-[0.6875rem] font-medium tracking-[0.08em]">
            {trail.blaze}
          </span>
          <span className="eyebrow text-muted">{trail.index}</span>
        </p>
        <p className="text-right text-[0.6875rem] tracking-[0.08em] text-muted uppercase">
          {trail.grade}
          <span className="mt-1 block normal-case tracking-normal">{gradeLabel[trail.grade]}</span>
        </p>
      </div>

      <h3 className="font-serif mt-6 text-[1.7rem] leading-[1.05] tracking-[-0.02em] sm:text-[1.9rem]">
        {trail.name}
      </h3>
      <p className="mt-3 text-[0.8125rem] text-muted">
        {trail.from}
        <span aria-hidden> → </span>
        {trail.to}
        {trail.loop ? " · anello" : ""}
      </p>
      <p className="lede mt-4">{trail.body}</p>

      <dl className="mt-8 grid grid-cols-3 gap-3 border-t border-[rgb(37_39_33_/_0.08)] pt-5 text-[0.75rem]">
        <div>
          <dt className="text-muted">Tempo</dt>
          <dd className="mt-1 text-ink">{trail.time}</dd>
        </div>
        <div>
          <dt className="text-muted">Dislivello</dt>
          <dd className="mt-1 text-ink">{trail.gain}</dd>
        </div>
        <div>
          <dt className="text-muted">Quote</dt>
          <dd className="mt-1 text-ink">
            {trail.startAlt}
            {trail.loop ? "" : ` → ${trail.endAlt}`}
          </dd>
        </div>
      </dl>

      {trail.fromHouse ? (
        <p className="mt-5 text-[0.8125rem] text-alpine-soft">Partenza da Gimillan</p>
      ) : null}
    </article>
  );
}
