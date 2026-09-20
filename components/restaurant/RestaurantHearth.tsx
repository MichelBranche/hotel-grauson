import { ImageReveal } from "@/components/ui/ImageReveal";
import { Reveal } from "@/components/ui/Reveal";

export function RestaurantHearth() {
  return (
    <section aria-labelledby="focolare-title" className="shell mt-5 sm:mt-7">
      <Reveal className="grid items-center gap-3 sm:gap-4 lg:grid-cols-[1fr_1.15fr]" y={30} stagger={0.12}>
        <div data-reveal className="flex flex-col justify-between gap-8 px-1 py-4 lg:order-2 lg:py-8">
          <div>
            <p className="eyebrow flex items-center gap-3 text-muted">
              La sala
              <span aria-hidden className="h-px w-12 bg-[rgb(37_39_33_/_0.16)]" />
            </p>
            <h2 id="focolare-title" className="display-lg mt-5">
              Servizio
              <br />
              in locanda
            </h2>
            <p className="lede mt-5 max-w-[32rem]">
              Il ristorante è interno alla struttura. Colazione al mattino; pranzo e cena con
              cucina cogneintse, in base alla disponibilità del giorno.
            </p>
          </div>
        </div>

        <div data-reveal className="lg:order-1">
          <ImageReveal
            src="/images/sala-comune.jpg"
            alt="La sala comune della locanda: caminetto acceso, il tavolo apparecchiato e la luce della sera"
            effect="sala"
            sizes="(max-width: 1023px) 92vw, 50vw"
            radius={26}
            className="aspect-[4/3] w-full sm:aspect-[16/10]"
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
      </Reveal>
    </section>
  );
}
