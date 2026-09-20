import Link from "next/link";

import { ArrowCircle } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { roomHref, roomLine, rooms } from "@/lib/rooms";

export function RoomIndexList() {
  return (
    <section aria-labelledby="tipologie-title" className="shell mt-5 sm:mt-7">
      <Reveal className="rounded-[var(--radius-panel)] bg-surface shadow-[var(--shadow-soft)]" y={28}>
        <div data-reveal className="flex flex-col gap-3 px-6 pt-7 pb-2 sm:px-8 sm:pt-9 lg:px-10">
          <p className="eyebrow flex items-center gap-3 text-muted">
            Le tipologie
            <span aria-hidden className="h-px w-12 bg-[rgb(37_39_33_/_0.16)]" />
          </p>
          <h2 id="tipologie-title" className="display-lg max-w-[18ch]">
            Tipologie disponibili
          </h2>
        </div>

        <ul>
          {rooms.map((room) => (
            <li key={room.slug} data-reveal>
              <Link
                href={roomHref(room.slug)}
                className="group grid grid-cols-[auto_1fr_auto] items-start gap-x-4 gap-y-2 border-t border-[rgb(37_39_33_/_0.07)] px-6 py-6 transition-colors duration-500 [transition-timing-function:var(--ease-out)] last:rounded-b-[var(--radius-panel)] hover:bg-[rgb(37_39_33_/_0.025)] sm:grid-cols-[4.5rem_minmax(0,1.3fr)_minmax(0,1fr)_auto] sm:items-center sm:gap-x-6 sm:px-8 sm:py-7 lg:px-10"
              >
                <span className="pt-1.5 text-[0.6875rem] font-medium tracking-[0.14em] text-muted sm:pt-0">
                  {room.index}
                </span>

                <span>
                  <span className="display-md block">{room.name}</span>
                  <span className="mt-1.5 block text-[0.875rem] text-muted">{room.promise}</span>
                </span>

                <span className="col-start-2 text-[0.75rem] tracking-[0.04em] text-muted sm:col-start-auto sm:justify-self-start">
                  {roomLine(room)}
                </span>

                <ArrowCircle className="self-center" />
              </Link>
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}
