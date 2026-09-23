"use client";

import Image from "next/image";
import { useCallback, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";

import { Reveal } from "@/components/ui/Reveal";
import { hotel } from "@/lib/content";
import { dishCategories, dishes, menuNote, type DishFilter } from "@/lib/restaurant";

function DishFilters({
  filter,
  onChange,
}: {
  filter: DishFilter;
  onChange: (id: DishFilter) => void;
}) {
  const track = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState({ x: 0, w: 0 });

  const measure = useCallback(() => {
    const active = track.current?.querySelector<HTMLButtonElement>("[aria-pressed='true']");
    if (!active) return;
    setIndicator({ x: active.offsetLeft, w: active.offsetWidth });
  }, []);

  useLayoutEffect(() => {
    measure();
  }, [filter, measure]);

  useLayoutEffect(() => {
    const root = track.current;
    if (!root) return;
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    return () => observer.disconnect();
  }, [measure]);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const ids = dishCategories.map((item) => item.id);
    const index = ids.indexOf(filter);
    const next =
      event.key === "ArrowRight"
        ? ids[(index + 1) % ids.length]
        : ids[(index - 1 + ids.length) % ids.length];
    onChange(next);
    track.current?.querySelector<HTMLButtonElement>(`[data-filter="${next}"]`)?.focus();
  }

  return (
    <div className="max-w-full overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div
        ref={track}
        role="group"
        aria-label="Filtra i piatti per portata"
        onKeyDown={onKeyDown}
        className="relative inline-flex rounded-full bg-surface p-1 shadow-[var(--shadow-soft)]"
      >
        <span
          aria-hidden
          className="pointer-events-none absolute top-1 left-0 h-10 rounded-full bg-alpine transition-[transform,width] duration-500 [transition-timing-function:var(--ease-out)] motion-reduce:transition-none"
          style={{ width: indicator.w, transform: `translate3d(${indicator.x}px,0,0)` }}
        />
        {dishCategories.map((item) => {
          const active = item.id === filter;
          return (
            <button
              key={item.id}
              type="button"
              data-filter={item.id}
              aria-pressed={active}
              onClick={() => onChange(item.id)}
              className={`relative z-10 h-10 shrink-0 rounded-full px-3.5 text-[0.8125rem] font-medium transition-colors duration-500 [transition-timing-function:var(--ease-skin)] sm:px-4 ${
                active ? "text-surface" : "text-ink/70 hover:text-ink"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function RestaurantMenu() {
  const [filter, setFilter] = useState<DishFilter>("tutti");
  const visible = useMemo(
    () => dishes.filter((dish) => dish.active && (filter === "tutti" || dish.category === filter)),
    [filter],
  );

  return (
    <section id="piatti" aria-labelledby="piatti-title" className="shell mt-14 scroll-mt-28 sm:mt-16">
      <Reveal y={24}>
        <div data-reveal>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-[36rem]">
              <h2
                id="piatti-title"
                className="font-[family-name:var(--font-display)]! text-[2.15rem] leading-none font-medium! tracking-[-0.03em] sm:text-[2.6rem]"
              >
                I nostri piatti
              </h2>
              <p className="lede mt-4">{menuNote}</p>
            </div>

            <DishFilters filter={filter} onChange={setFilter} />
          </div>

          {visible.length ? (
            <ul className="mt-6 grid items-stretch gap-4 sm:mt-8 md:grid-cols-2 xl:grid-cols-4">
              {visible.map((dish) => (
                <li key={dish.slug} className="h-full">
                  <article className="flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] bg-surface shadow-[var(--shadow-soft)]">
                    <div className="relative aspect-[4/3] overflow-hidden bg-alpine">
                      <Image
                        src={dish.image.src}
                        alt={dish.image.alt}
                        fill
                        sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 25vw"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex flex-1 flex-col px-5 pt-5 pb-6">
                      <h3 className="font-[family-name:var(--font-display)]! text-[1.45rem] leading-none font-medium! tracking-[-0.02em] sm:text-[1.6rem]">
                        {dish.name}
                      </h3>
                      <p className="mt-3 line-clamp-2 min-h-[2.9em] text-[0.9rem] leading-relaxed text-muted">
                        {dish.description}
                      </p>
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-8 max-w-[32rem] text-[0.95rem] leading-relaxed text-muted">
              In questa portata non c&apos;è un piatto fisso. Si chiede in sala, oppure si prenota
              al {hotel.phone}.
            </p>
          )}
        </div>
      </Reveal>
    </section>
  );
}
