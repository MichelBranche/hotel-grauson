import { Reveal } from "@/components/ui/Reveal";
import { around } from "@/lib/cogne";

export function CogneAround() {
  return (
    <section aria-labelledby="dintorni-title" className="shell mt-5 sm:mt-7">
      <Reveal className="rounded-[var(--radius-panel)] bg-surface px-6 py-10 shadow-[var(--shadow-soft)] sm:px-10 sm:py-14 lg:px-16 lg:py-16">
        <div data-reveal className="max-w-[38rem]">
          <p className="eyebrow flex items-center gap-3 text-muted">
            Intorno
            <span aria-hidden className="h-px w-12 bg-[rgb(37_39_33_/_0.16)]" />
          </p>
          <h2 id="dintorni-title" className="display-lg mt-5">
            Attività
            <br />
            e dintorni
          </h2>
          <p className="lede mt-5">
            Indicazioni da Gimillan e da Cogne. Dati sentieri: Ufficio del Turismo di Cogne, 2024.
          </p>
        </div>

        <ol className="mt-12 grid gap-10 border-t border-[rgb(37_39_33_/_0.08)] pt-10 lg:grid-cols-3 lg:gap-12">
          {around.map((item, index) => (
            <li key={item.kicker} data-reveal>
              <p className="eyebrow text-muted">
                {String(index + 1).padStart(2, "0")} · {item.kicker}
              </p>
              <h3 className="mt-4 font-serif text-[1.85rem] leading-none tracking-[-0.02em] sm:text-[2.05rem]">
                {item.title}
              </h3>
              <p className="mt-4 max-w-[28rem] text-[0.9375rem] leading-relaxed text-muted">
                {item.body}
              </p>
            </li>
          ))}
        </ol>
      </Reveal>
    </section>
  );
}
