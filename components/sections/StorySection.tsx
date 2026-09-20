import { ImageReveal } from "@/components/ui/ImageReveal";
import { Reveal } from "@/components/ui/Reveal";
import { hotel, houseNotes } from "@/lib/content";

export function StorySection() {
  return (
    <section id="la-locanda" aria-labelledby="storia-title" className="shell mt-5 sm:mt-7">
      <Reveal
        className="grid items-start gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-[1.85fr_1.1fr_0.95fr]"
        y={30}
        stagger={0.12}
      >
        <div data-reveal className="relative md:col-span-2 lg:col-span-1">
          <ImageReveal
            src="/images/sala-soggiorno.jpg"
            alt="Il soggiorno della locanda: divano a fiori, muro in pietra e il tavolino con la candela"
            sizes="(max-width: 1023px) 92vw, 46vw"
            radius={26}
            className="aspect-[4/3] w-full sm:aspect-[16/10] lg:aspect-[16/9]"
          >
            <div
              aria-hidden
              className="absolute inset-x-0 bottom-0 h-2/5 bg-[linear-gradient(to_top,rgb(18_22_16_/_0.55),transparent)]"
            />
            <p className="hand hand-on-photo absolute bottom-5 left-6 text-[1.15rem] leading-[1.15] text-surface/92 sm:text-[1.3rem]">
              Soggiorno
            </p>
          </ImageReveal>
        </div>

        <div data-reveal className="flex h-full flex-col justify-between gap-8 px-1 pt-4 lg:pt-8 lg:pb-4">
          <div>
            <p className="eyebrow flex items-center gap-3 text-muted">
              La locanda
              <span aria-hidden className="h-px w-12 bg-[rgb(37_39_33_/_0.16)]" />
            </p>

            <h2 id="storia-title" className="display-lg mt-5">
              La locanda
              <br />
              a Gimillan
            </h2>

            <p className="lede mt-5 max-w-[34rem]">
              La famiglia {hotel.family} gestisce la struttura dal {hotel.since}. Gimillan è una
              frazione di Cogne, a {hotel.altitude}, nel Parco Nazionale del Gran Paradiso.
            </p>
          </div>
        </div>

        <figure
          data-reveal
          className="flex flex-col gap-5 rounded-[var(--radius-card)] border border-[rgb(37_39_33_/_0.06)] bg-surface p-6 shadow-[var(--shadow-soft)] sm:p-7"
        >
          <p className="eyebrow text-muted">La famiglia</p>
          <p className="font-serif text-[1.85rem] leading-[1.05] tracking-[-0.02em] sm:text-[2.05rem]">
            {hotel.family}
          </p>
          <p className="text-[0.9375rem] leading-relaxed text-ink/80">
            Gestione familiare dal {hotel.since}, a Gimillan di Cogne.
          </p>
          <ul className="mt-auto flex flex-col gap-2.5 border-t border-[rgb(37_39_33_/_0.07)] pt-5">
            {houseNotes.map((item) => (
              <li key={item} className="flex items-start gap-3 text-[0.875rem] leading-snug text-ink/80">
                <span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full bg-alpine/40" />
                {item}
              </li>
            ))}
          </ul>
        </figure>
      </Reveal>
    </section>
  );
}
