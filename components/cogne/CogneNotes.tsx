import { Reveal } from "@/components/ui/Reveal";
import { cogneOffice } from "@/lib/cogne";

export function CogneNotes() {
  return (
    <section aria-labelledby="note-title" className="shell mt-5 sm:mt-7">
      <Reveal>
        <div
          data-reveal
          className="on-dark relative overflow-hidden rounded-[var(--radius-panel)] bg-alpine-deep px-6 py-12 text-surface sm:px-10 sm:py-16 lg:px-16"
        >
          <p className="hand absolute top-8 right-[var(--gutter)] hidden max-w-[8rem] rotate-[-3deg] text-right text-[1.25rem] text-surface/45 md:block">
            Informazioni
          </p>

          <p className="eyebrow flex items-center gap-3 text-surface/55">
            Note di sentiero
            <span aria-hidden className="h-px w-12 bg-surface/20" />
          </p>
          <h2 id="note-title" className="display-lg mt-5 max-w-[16ch]">
            Ufficio del turismo
          </h2>
          <p className="mt-5 max-w-[34rem] text-[0.975rem] leading-[1.62] text-surface/65">
            In locanda si indica il punto di partenza. Carta, orari aggiornati e regolamento del
            Parco sono disponibili in paese, all’Ufficio del Turismo di Cogne.
          </p>

          <ul className="mt-10 max-w-[36rem] space-y-4 text-[0.9375rem] leading-relaxed text-surface/70">
            <li>
              Cani nel Gran Paradiso: al guinzaglio, e solo in fondovalle — il resto è nel
              regolamento del parco.
            </li>
            <li>
              Tempi e dislivelli in questa pagina: Ufficio del Turismo Cogne, passeggiate facili
              2024. Con neve o maltempo i percorsi possono essere chiusi.
            </li>
            <li>
              Carta 1:25.000 disponibile in piazza. Non utilizzare stampe da schermo.
            </li>
          </ul>

          <div className="mt-10 flex flex-wrap items-end justify-between gap-8 border-t border-surface/12 pt-8">
            <div>
              <p className="eyebrow text-surface/45">{cogneOffice.name}</p>
              <p className="mt-3 text-[0.9375rem] text-surface/80">
                {cogneOffice.street}
                <br />
                {cogneOffice.city}
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
                <a
                  href={cogneOffice.phoneHref}
                  className="inline-flex h-[3.125rem] items-center rounded-full bg-surface px-6 text-[0.8125rem] font-medium text-ink transition-colors duration-500 hover:bg-white"
                >
                  {cogneOffice.phone}
                </a>
                <a
                  href={`mailto:${cogneOffice.email}`}
                  className="text-[0.8125rem] text-surface/70 underline decoration-surface/25 underline-offset-4 hover:text-surface hover:decoration-surface"
                >
                  {cogneOffice.email}
                </a>
              </div>
            </div>

            <div className="flex flex-col gap-3 text-[0.8125rem]">
              <a
                href={cogneOffice.walksPdf}
                target="_blank"
                rel="noreferrer noopener"
                className="text-surface/70 underline decoration-surface/25 underline-offset-4 hover:text-surface hover:decoration-surface"
              >
                Passeggiate facili, 2024
              </a>
              <a
                href={cogneOffice.park}
                target="_blank"
                rel="noreferrer noopener"
                className="text-surface/70 underline decoration-surface/25 underline-offset-4 hover:text-surface hover:decoration-surface"
              >
                Sentieri del Parco
              </a>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
