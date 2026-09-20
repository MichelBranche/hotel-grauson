import Link from "next/link";

import { ArrowRight } from "lucide-react";

import { ButtonLink } from "@/components/ui/Button";
import { ImageReveal } from "@/components/ui/ImageReveal";
import { Reveal } from "@/components/ui/Reveal";
import { otherRooms, roomAmenities, roomHref, roomRules, type Room } from "@/lib/rooms";

export function RoomDetail({ room }: { room: Room }) {
  const others = otherRooms(room.slug);
  const extras = [...room.extras];

  return (
    <>
      <section aria-labelledby="scheda-title" className="shell mt-5 sm:mt-7">
        <Reveal
          className="grid items-start gap-3 sm:gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]"
          y={28}
          stagger={0.1}
        >
          <div data-reveal className="rounded-[var(--radius-panel)] bg-surface px-6 py-8 shadow-[var(--shadow-soft)] sm:px-9 sm:py-10">
            <p className="eyebrow flex items-center gap-3 text-muted">
              {room.index} · {room.name}
              <span aria-hidden className="h-px w-12 bg-[rgb(37_39_33_/_0.16)]" />
            </p>
            <h2 id="scheda-title" className="sr-only">
              {room.name}
            </h2>
            <p className="lede mt-6 max-w-[36rem] text-ink/80">{room.story}</p>

            <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-[rgb(37_39_33_/_0.07)] pt-7 sm:grid-cols-3">
              {room.size ? <Spec label="Misura" value={room.size} /> : null}
              <Spec
                label="Ospiti"
                value={
                  room.children
                    ? `${room.guests} adulti · ${room.children} ${room.children === 1 ? "bambino" : "bambini"}`
                    : room.guestLabel
                }
              />
              {room.beds ? <Spec label="Letti" value={room.beds} /> : null}
            </dl>

            <div className="mt-9">
              <ButtonLink href="#prenota" variant="dark" size="lg">
                Prenota questa camera
              </ButtonLink>
            </div>
          </div>

          <aside
            data-reveal
            className="flex h-full flex-col justify-between gap-8 rounded-[var(--radius-card)] border border-[rgb(37_39_33_/_0.06)] bg-surface px-6 py-7 shadow-[var(--shadow-soft)] sm:px-7 sm:py-8"
          >
            <div>
              <p className="eyebrow text-muted">In questa camera</p>
              <ul className="mt-6 flex flex-col gap-3">
                {roomAmenities.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-[0.875rem] leading-snug text-ink/80">
                    <span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full bg-alpine/40" />
                    {item}
                  </li>
                ))}
                {extras.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-[0.875rem] leading-snug text-ink/80">
                    <span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full bg-wood/70" />
                    {item}
                  </li>
                ))}
              </ul>
              <dl className="mt-6 flex flex-col gap-3 border-t border-[rgb(37_39_33_/_0.07)] pt-6">
                {roomRules.map((rule) => (
                  <div key={rule.title}>
                    <dt className="text-[0.6875rem] tracking-[0.12em] text-muted uppercase">{rule.title}</dt>
                    <dd className="mt-1 text-[0.8125rem] leading-snug text-ink/75">{rule.body}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <p className="hand text-[1.25rem] leading-[1.15] whitespace-pre-line text-alpine/70">
              {room.note}
            </p>
          </aside>
        </Reveal>
      </section>

      <section aria-labelledby="intorno-title" className="shell mt-5 sm:mt-7">
        <Reveal className="grid items-center gap-3 sm:gap-4 lg:grid-cols-[1.2fr_1fr]" y={28} stagger={0.12}>
          <div data-reveal>
            <ImageReveal
              src={room.house.src}
              alt={room.house.alt}
              effect={room.house.effect}
              sizes="(max-width: 1023px) 92vw, 55vw"
              radius={26}
              className="aspect-[4/3] w-full sm:aspect-[16/10]"
            >
              <div
                aria-hidden
                className="absolute inset-x-0 bottom-0 h-2/5 bg-[linear-gradient(to_top,rgb(18_22_16_/_0.5),transparent)]"
              />
            </ImageReveal>
          </div>

          <div data-reveal className="flex flex-col justify-between gap-8 px-1 py-4 lg:py-6">
            <div>
              <p className="eyebrow flex items-center gap-3 text-muted">
                La locanda
                <span aria-hidden className="h-px w-12 bg-[rgb(37_39_33_/_0.16)]" />
              </p>
              <h2 id="intorno-title" className="display-lg mt-5">
                Spazi comuni
                <br />
                e servizi
              </h2>
              <p className="lede mt-5 max-w-[32rem]">
                Soggiorno, caminetto e sala da pranzo. All’esterno: terrazza, giardino e parcheggio
                privato.
              </p>
            </div>
            <ButtonLink href="/#la-locanda" variant="quiet" size="lg" className="self-start">
              La locanda
            </ButtonLink>
          </div>
        </Reveal>
      </section>

      <section aria-labelledby="altre-title" className="shell mt-5 sm:mt-7">
        <Reveal className="rounded-[var(--radius-panel)] bg-surface shadow-[var(--shadow-soft)]" y={24}>
          <div data-reveal className="px-6 pt-7 pb-2 sm:px-8 sm:pt-8 lg:px-10">
            <h2 id="altre-title" className="display-md">
              Le altre camere
            </h2>
          </div>
          <ul>
            {others.map((item) => (
              <li key={item.slug} data-reveal>
                <Link
                  href={roomHref(item.slug)}
                  className="group flex items-center justify-between gap-4 border-t border-[rgb(37_39_33_/_0.07)] px-6 py-5 transition-colors duration-500 [transition-timing-function:var(--ease-out)] hover:bg-[rgb(37_39_33_/_0.025)] sm:px-8 lg:px-10"
                >
                  <span>
                    <span className="mr-4 text-[0.6875rem] tracking-[0.14em] text-muted">
                      {item.index}
                    </span>
                    <span className="text-[0.9375rem]">{item.name}</span>
                  </span>
                  <ArrowRight
                    className="arrow-slide size-4 shrink-0 text-muted"
                    strokeWidth={1.5}
                    aria-hidden
                  />
                </Link>
              </li>
            ))}
          </ul>
        </Reveal>
      </section>
    </>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[0.6875rem] tracking-[0.12em] text-muted uppercase">{label}</dt>
      <dd className="mt-1.5 text-[0.9375rem]">{value}</dd>
    </div>
  );
}
