import { ButtonLink } from "@/components/ui/Button";
import { ImageReveal } from "@/components/ui/ImageReveal";
import { Reveal } from "@/components/ui/Reveal";
import { roomAmenities, roomRules } from "@/lib/rooms";

export function RoomHouseChapter() {
  return (
    <section aria-labelledby="casa-title" className="shell mt-5 sm:mt-7">
      <Reveal
        className="grid items-stretch gap-3 sm:gap-4 lg:grid-cols-[1.25fr_1fr]"
        y={30}
        stagger={0.12}
      >
        <div data-reveal>
          <ImageReveal
            src="/images/sala-comune.jpg"
            alt="La sala comune della locanda: caminetto acceso, il tavolo da pranzo e la luce della sera"
            effect="sala"
            sizes="(max-width: 1023px) 92vw, 55vw"
            radius={26}
            className="aspect-[4/3] h-full min-h-[18rem] w-full sm:aspect-[16/10] lg:aspect-auto lg:min-h-[28rem]"
          >
            <div
              aria-hidden
              className="absolute inset-x-0 bottom-0 h-2/5 bg-[linear-gradient(to_top,rgb(18_22_16_/_0.55),transparent)]"
            />
            <p className="hand hand-on-photo absolute bottom-5 left-6 text-[1.15rem] leading-[1.15] text-surface/92 sm:text-[1.3rem]">
              Sala comune
            </p>
          </ImageReveal>
        </div>

        <div
          data-reveal
          className="flex flex-col justify-between gap-8 rounded-[var(--radius-card)] bg-surface px-6 py-7 shadow-[var(--shadow-soft)] sm:px-8 sm:py-9"
        >
          <div>
            <p className="eyebrow flex items-center gap-3 text-muted">
              In ogni camera
              <span aria-hidden className="h-px w-12 bg-[rgb(37_39_33_/_0.16)]" />
            </p>
            <h2 id="casa-title" className="display-lg mt-5">
              Servizi in camera
              <br />
              e in struttura
            </h2>
            <p className="lede mt-5 max-w-[32rem]">
              Ogni camera ha bagno privato, Wi-Fi e riscaldamento. In comune: terrazza, giardino,
              parcheggio privato, soggiorno e sala da pranzo.
            </p>
          </div>

          <ul className="flex flex-col gap-3 border-t border-[rgb(37_39_33_/_0.07)] pt-6">
            {roomAmenities.map((item) => (
              <li key={item} className="flex items-start gap-3 text-[0.875rem] leading-snug text-ink/80">
                <span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full bg-alpine/40" />
                {item}
              </li>
            ))}
          </ul>

          <dl className="flex flex-col gap-4 border-t border-[rgb(37_39_33_/_0.07)] pt-6">
            {roomRules.map((rule) => (
              <div key={rule.title}>
                <dt className="text-[0.6875rem] tracking-[0.12em] text-muted uppercase">{rule.title}</dt>
                <dd className="mt-1.5 text-[0.875rem] leading-snug text-ink/80">{rule.body}</dd>
              </div>
            ))}
          </dl>

          <ButtonLink href="#prenota" variant="dark" size="lg" className="self-start">
            Verifica disponibilità
          </ButtonLink>
        </div>
      </Reveal>
    </section>
  );
}
