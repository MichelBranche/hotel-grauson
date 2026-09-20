import { ImageReveal } from "@/components/ui/ImageReveal";
import { Reveal } from "@/components/ui/Reveal";

export function CognePlace() {
  return (
    <section aria-labelledby="luoghi-title" className="shell mt-5 sm:mt-7">
      <Reveal className="mb-5 max-w-[38rem] px-1 sm:mb-7" y={24}>
        <p data-reveal className="eyebrow flex items-center gap-3 text-muted">
          Due luoghi
          <span aria-hidden className="h-px w-12 bg-[rgb(37_39_33_/_0.16)]" />
        </p>
        <h2 id="luoghi-title" data-reveal className="display-lg mt-5">
          Gimillan
          <br />
          e Cogne
        </h2>
        <p data-reveal className="lede mt-5">
          Gimillan è una frazione di versante. Cogne è il centro in fondovalle: servizi, piazza e
          Centro visitatori del Parco. A Lillaz si trovano le cascate.
        </p>
      </Reveal>

      <Reveal className="grid gap-3 sm:gap-4 lg:grid-cols-2" y={30} stagger={0.12}>
        <figure data-reveal className="relative" aria-label="La tradizione di Cogne, le fisarmoniche in valle">
          <ImageReveal
            src="/images/tradizione-cogne.jpg"
            alt="Suonatori di fisarmonica in costume, all’aperto sopra Cogne, con il bosco alle spalle"
            sizes="(max-width: 1023px) 92vw, 46vw"
            radius={26}
            className="aspect-[4/5] w-full sm:aspect-[4/3]"
          >
            <div
              aria-hidden
              className="absolute inset-x-0 bottom-0 h-2/5 bg-[linear-gradient(to_top,rgb(18_22_16_/_0.58),transparent)]"
            />
            <div className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-4 text-surface">
              <p>
                <span className="eyebrow block text-surface/70">Il paese</span>
                <span className="mt-2 block font-serif text-[1.65rem] leading-none tracking-[-0.02em] sm:text-[1.9rem]">
                  Tradizione locale
                </span>
              </p>
              <p className="hand hand-on-photo hidden max-w-[7rem] rotate-[-3deg] text-right text-[1.15rem] leading-[1.15] sm:block">
                Cogne
              </p>
            </div>
          </ImageReveal>
        </figure>

        <figure data-reveal className="relative lg:mt-16" aria-label="La vallata di Cogne, l’acqua e le cime">
          <ImageReveal
            seasonal="cogne"
            sizes="(max-width: 1023px) 92vw, 46vw"
            radius={26}
            className="aspect-[4/5] w-full sm:aspect-[4/3]"
          >
            <div
              aria-hidden
              className="absolute inset-x-0 bottom-0 h-2/5 bg-[linear-gradient(to_top,rgb(18_22_16_/_0.55),transparent)]"
            />
            <div className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-4 text-surface">
              <p>
                <span className="eyebrow block text-surface/70">La vallata</span>
                <span className="mt-2 block font-serif text-[1.65rem] leading-none tracking-[-0.02em] sm:text-[1.9rem]">
                  Vallata di Cogne
                </span>
              </p>
              <p className="hand hand-on-photo hidden max-w-[7rem] rotate-[-3deg] text-right text-[1.15rem] leading-[1.15] sm:block">
                Gran Paradiso
              </p>
            </div>
          </ImageReveal>
        </figure>
      </Reveal>
    </section>
  );
}
