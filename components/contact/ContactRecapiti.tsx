import { MagneticButton } from "@/components/ui/MagneticButton";
import { Reveal } from "@/components/ui/Reveal";
import { hotel } from "@/lib/content";

export function ContactRecapiti() {
  return (
    <section aria-labelledby="recapiti-title" className="shell relative z-20 -mt-8 sm:-mt-10">
      <Reveal className="rounded-[var(--radius-panel)] bg-surface px-5 py-10 shadow-[var(--shadow-lift)] sm:px-10 sm:py-14 lg:px-14">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-start lg:gap-16">
          <div data-reveal>
            <p className="eyebrow flex items-center gap-3 text-muted">
              Recapiti
              <span aria-hidden className="h-px w-12 bg-[rgb(37_39_33_/_0.16)]" />
            </p>
            <h2 id="recapiti-title" className="display-lg mt-5">
              Si chiama,
              <br />
              si scrive
            </h2>
            <p className="lede mt-5 max-w-[32rem]">
              Gestione {hotel.family}. Rispondiamo al telefono della casa, o per lettera.
            </p>

            <address className="mt-10 not-italic">
              <p className="text-[0.9375rem] leading-relaxed text-ink">
                {hotel.address.street}
                <br />
                {hotel.address.postalCode} {hotel.address.city} ({hotel.address.province})
              </p>
              <p className="mt-3 text-[0.75rem] tracking-[0.08em] text-muted uppercase">
                {hotel.geo.lat.toFixed(4)} N · {hotel.geo.lng.toFixed(4)} E
              </p>
            </address>

            <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-4">
              <MagneticButton>
                <a
                  href={hotel.phoneHref}
                  className="arrow-parent group inline-flex h-[3.125rem] items-center justify-center rounded-full bg-accent px-6 text-[0.8125rem] font-medium text-surface shadow-[0_10px_24px_-16px_rgb(38_50_41_/_0.8)] transition-colors duration-500 [transition-timing-function:var(--ease-out)] hover:bg-accent-hover"
                >
                  {hotel.phone}
                </a>
              </MagneticButton>
              <a
                href={`mailto:${hotel.email}`}
                className="text-[0.8125rem] text-ink underline decoration-[rgb(37_39_33_/_0.25)] underline-offset-4 transition-colors duration-400 hover:decoration-ink"
              >
                {hotel.email}
              </a>
            </div>
          </div>

          <dl
            data-reveal
            className="grid gap-7 border-t border-[rgb(37_39_33_/_0.08)] pt-8 sm:grid-cols-2 lg:grid-cols-1 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-12"
          >
            <div>
              <dt className="text-[0.6875rem] tracking-[0.12em] text-muted uppercase">In camera</dt>
              <dd className="mt-2 text-[0.9375rem] leading-relaxed text-ink">
                Check-in dalle {hotel.checkIn.slice(0, 2)}. Check-out alle {hotel.checkOut.slice(0, 2)}.
              </dd>
            </div>
            <div>
              <dt className="text-[0.6875rem] tracking-[0.12em] text-muted uppercase">In casa</dt>
              <dd className="mt-2 text-[0.9375rem] leading-relaxed text-ink">
                Parcheggio privato gratuito. Animali non ammessi.
              </dd>
            </div>
            <div className="sm:col-span-2 lg:col-span-1">
              <dt className="text-[0.6875rem] tracking-[0.12em] text-muted uppercase">Il tavolo</dt>
              <dd className="mt-2 text-[0.9375rem] leading-relaxed text-ink">
                Pranzo e cena su prenotazione telefonica.
              </dd>
            </div>
          </dl>
        </div>
      </Reveal>
    </section>
  );
}
