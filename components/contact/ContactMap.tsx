import { Reveal } from "@/components/ui/Reveal";
import { contactGoogleDir, contactGoogleEmbed, contactGooglePlace } from "@/lib/contact";
import { hotel } from "@/lib/content";

export function ContactMap() {
  return (
    <section id="carta" aria-labelledby="carta-title" className="shell mt-5 scroll-mt-28 sm:mt-7">
      <Reveal className="overflow-hidden rounded-[var(--radius-panel)] bg-alpine-deep text-surface shadow-[var(--shadow-soft)]">
        <div className="grid lg:grid-cols-[minmax(16rem,22rem)_minmax(0,1fr)]">
          <div data-reveal className="flex flex-col justify-between gap-8 px-5 py-8 sm:px-8 sm:py-9 lg:px-10">
            <div>
              <p className="eyebrow flex items-center gap-3 text-surface/55">
                La carta
                <span aria-hidden className="h-px w-12 bg-surface/20" />
              </p>
              <h2 id="carta-title" className="display-lg mt-4">
                Gimillan,
                <br />
                sopra Cogne
              </h2>
              <p className="mt-4 max-w-[22rem] text-[0.9rem] leading-[1.55] text-surface/65">
                Il punto è la locanda. La strada sale dal paese in tre chilometri.
              </p>
            </div>

            <div className="flex flex-wrap gap-x-5 gap-y-2 text-[0.75rem] text-surface/60">
              <a
                href={contactGooglePlace}
                target="_blank"
                rel="noreferrer noopener"
                className="underline decoration-surface/25 underline-offset-4 hover:text-surface hover:decoration-surface"
              >
                Mappa intera
              </a>
              <a
                href={contactGoogleDir}
                target="_blank"
                rel="noreferrer noopener"
                className="underline decoration-surface/25 underline-offset-4 hover:text-surface hover:decoration-surface"
              >
                Indicazioni
              </a>
            </div>
          </div>

          <div data-reveal className="aspect-[16/10] w-full lg:aspect-auto lg:min-h-[20rem]">
            <iframe
              title={`Google Maps: ${hotel.name}, ${hotel.hamlet}`}
              src={contactGoogleEmbed}
              className="h-full w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </div>
      </Reveal>
    </section>
  );
}
