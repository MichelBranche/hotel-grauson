"use client";

import { Mountain, Ruler, ShowerHead, Sofa, Users, Wifi, Thermometer } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import { ArrowCircle } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { SeasonalImage } from "@/components/ui/SeasonalImage";
import { roomHref, rooms, type Room } from "@/lib/rooms";

const strip = [
  { icon: Mountain, label: "Vista montagne" },
  { icon: Sofa, label: "Arredi in legno" },
  { icon: Wifi, label: "Wi-Fi gratuito" },
  { icon: ShowerHead, label: "Bagno privato" },
  { icon: Thermometer, label: "Riscaldamento" },
] as const;

const filters = [
  { id: "tutte", label: "Tutte" },
  { id: "due", label: "1–2 ospiti" },
  { id: "tre", label: "3 ospiti" },
  { id: "quattro", label: "4 ospiti" },
] as const;

type FilterId = (typeof filters)[number]["id"];

function matches(room: Room, filter: FilterId) {
  if (filter === "tutte") return true;
  if (filter === "due") return room.guests <= 2;
  if (filter === "tre") return room.guests === 3;
  return room.guests >= 4;
}

function RoomPhoto({ room }: { room: Room }) {
  if (room.image.seasonal) {
    return (
      <SeasonalImage
        slot={room.image.seasonal}
        sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 33vw"
        className="object-cover transition-transform duration-700 [transition-timing-function:var(--ease-out)] group-hover:scale-[1.04]"
      />
    );
  }

  return (
    <Image
      src={room.image.src}
      alt={room.image.alt}
      fill
      sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 33vw"
      className="object-cover transition-transform duration-700 [transition-timing-function:var(--ease-out)] group-hover:scale-[1.04]"
    />
  );
}

export function RoomCatalog() {
  const [filter, setFilter] = useState<FilterId>("tutte");
  const visible = useMemo(() => rooms.filter((room) => matches(room, filter)), [filter]);

  return (
    <>
      <section aria-label="Servizi delle camere" className="shell mt-4 sm:mt-5">
        <ul className="grid grid-cols-5 gap-1 rounded-[var(--radius-panel)] bg-surface px-2 py-4 shadow-[var(--shadow-soft)] sm:gap-2 sm:px-4 sm:py-5">
          {strip.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.label} className="flex min-w-0 flex-col items-center gap-2 text-center">
                <Icon className="size-[18px] shrink-0 text-alpine sm:size-5" strokeWidth={1.4} aria-hidden />
                <span className="text-[0.62rem] leading-tight text-ink/75 sm:text-[0.75rem]">{item.label}</span>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="tipologie-title" className="shell mt-8 sm:mt-10">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <h2 id="tipologie-title" className="sr-only">
            Tipologie di camera
          </h2>
          <div
            role="group"
            aria-label="Filtra le camere per capienza"
            className="flex flex-wrap gap-1.5"
          >
            {filters.map((item) => {
              const active = item.id === filter;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setFilter(item.id)}
                  className={`h-10 rounded-full px-4 text-[0.8125rem] font-medium transition-colors duration-500 [transition-timing-function:var(--ease-skin)] ${
                    active ? "bg-alpine text-surface" : "bg-surface text-ink/75 hover:text-ink"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <Reveal
          as="ul"
          className="mt-5 grid gap-4 sm:mt-6 lg:grid-cols-2 xl:grid-cols-3"
          y={24}
          stagger={0.08}
        >
          {visible.map((room) => (
            <li key={room.slug} data-reveal>
              <Link
                href={roomHref(room.slug)}
                className="group flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] bg-surface shadow-[var(--shadow-soft)]"
              >
                <span className="relative block aspect-[16/11] overflow-hidden bg-alpine">
                  <RoomPhoto room={room} />
                </span>
                <span className="flex flex-1 flex-col px-5 pt-5 pb-5 sm:px-6 sm:pt-6">
                  <span className="font-serif text-[1.65rem] leading-none tracking-[-0.02em] sm:text-[1.85rem]">
                    {room.name}
                  </span>
                  <span className="mt-3 line-clamp-2 text-[0.9rem] leading-relaxed text-muted">{room.lede}</span>
                  <span className="mt-5 flex items-end justify-between gap-4">
                    <span className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.8125rem] text-ink/75">
                      <span className="inline-flex items-center gap-1.5">
                        <Users className="size-3.5 shrink-0" strokeWidth={1.5} aria-hidden />
                        {room.guestLabel}
                      </span>
                      {room.size ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Ruler className="size-3.5 shrink-0" strokeWidth={1.5} aria-hidden />
                          {room.size}
                        </span>
                      ) : null}
                    </span>
                    <ArrowCircle tone="alpine" />
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </Reveal>
      </section>
    </>
  );
}
