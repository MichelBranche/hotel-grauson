import { Reveal } from "@/components/ui/Reveal";
import { hotel } from "@/lib/content";

export function RestaurantReserve() {
  return (
    <section id="tavolo" aria-labelledby="tavolo-title" className="shell mt-5 sm:mt-7">
      <Reveal>
        <div
          data-reveal
          className="on-dark relative overflow-hidden rounded-[var(--radius-panel)] bg-alpine-deep px-6 py-12 text-surface sm:px-10 sm:py-16 lg:px-16"
        >
          <p className="hand absolute top-8 right-[var(--gutter)] hidden max-w-[8rem] rotate-[-3deg] text-right text-[1.25rem] text-surface/45 md:block">
            Prenotazione
          </p>

          <p className="eyebrow flex items-center gap-3 text-surface/55">
            Prenotare
            <span aria-hidden className="h-px w-12 bg-surface/20" />
          </p>
          <h2 id="tavolo-title" className="display-lg mt-5 max-w-[16ch]">
            Prenotazione tavolo
          </h2>
          <p className="mt-5 max-w-[32rem] text-[0.975rem] leading-[1.62] text-surface/65">
            Per pranzo o cena è necessaria una prenotazione telefonica. Gestione{" "}
            {hotel.family}. Colazione inclusa per gli ospiti in camera.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-5">
            <a
              href={hotel.phoneHref}
              className="arrow-parent group inline-flex h-[3.125rem] items-center justify-center gap-2.5 rounded-full bg-surface px-6 text-[0.8125rem] font-medium text-ink shadow-[0_10px_24px_-18px_rgb(37_39_33_/_0.5)] transition-colors duration-500 [transition-timing-function:var(--ease-out)] hover:bg-white"
            >
              <span>{hotel.phone}</span>
            </a>
            <a
              href={`mailto:${hotel.email}`}
              className="text-[0.8125rem] text-surface/70 underline decoration-surface/25 underline-offset-4 transition-colors duration-400 hover:text-surface hover:decoration-surface"
            >
              {hotel.email}
            </a>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
