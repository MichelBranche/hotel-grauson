import { Reveal } from "@/components/ui/Reveal";
import { hotel } from "@/lib/content";

const facts = [
  { kicker: "Qui", value: hotel.hamlet, note: hotel.altitude },
  { kicker: "Sotto", value: "Cogne", note: "1.540 m" },
  { kicker: "Intorno", value: "Quattro valli", note: "Bacino di Cogne" },
  { kicker: "Il parco", value: "Gran Paradiso", note: "Dal 1922" },
] as const;

export function CogneBoard() {
  return (
    <section aria-labelledby="orientamento-title" className="shell mt-5 sm:mt-7">
      <Reveal>
        <div
          data-reveal
          className="on-dark overflow-hidden rounded-[var(--radius-panel)] bg-alpine-deep px-6 py-10 text-surface sm:px-10 sm:py-14 lg:px-16"
        >
          <p className="eyebrow flex items-center gap-3 text-surface/55">
            Orientamento
            <span aria-hidden className="h-px w-12 bg-surface/20" />
          </p>
          <h2 id="orientamento-title" className="display-lg mt-5 max-w-[16ch]">
            Posizione
          </h2>
          <p className="mt-5 max-w-[34rem] text-[0.975rem] leading-[1.62] text-surface/65">
            La locanda è a Gimillan, frazione di Cogne, a {hotel.altitude}. Cogne è raggiungibile
            a piedi in circa 20 minuti: piazza e Centro visitatori del Parco. Quattro valli nel
            Parco Nazionale del Gran Paradiso.
          </p>

          <dl className="mt-12 grid grid-cols-2 gap-x-6 gap-y-8 border-t border-surface/12 pt-10 lg:grid-cols-4">
            {facts.map((fact) => (
              <div key={fact.kicker}>
                <dt className="eyebrow text-surface/45">{fact.kicker}</dt>
                <dd className="mt-3 font-serif text-[1.65rem] leading-none tracking-[-0.02em] sm:text-[1.85rem]">
                  {fact.value}
                </dd>
                <dd className="mt-2 text-[0.8125rem] text-surface/55">{fact.note}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Reveal>
    </section>
  );
}
