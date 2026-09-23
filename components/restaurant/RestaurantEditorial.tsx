import { ButtonLink } from "@/components/ui/Button";
import { ImageReveal } from "@/components/ui/ImageReveal";
import { Reveal } from "@/components/ui/Reveal";

export function RestaurantEditorial() {
  return (
    <section id="cucina" aria-labelledby="cucina-title" className="shell mt-10 scroll-mt-28 sm:mt-14">
      <Reveal className="grid items-center gap-8 md:grid-cols-2 md:gap-8 lg:gap-14" y={28} stagger={0.1}>
        <div data-reveal className="max-w-[36rem]">
          <p className="eyebrow flex items-center gap-3 text-muted">
            La nostra cucina
            <span aria-hidden className="h-px w-10 bg-[rgb(37_39_33_/_0.16)] sm:w-14" />
          </p>
          <h2
            id="cucina-title"
            className="mt-5 max-w-[12ch] font-[family-name:var(--font-display)]! text-[2.35rem] leading-[1.02] font-medium! tracking-[-0.03em] sm:text-[2.85rem] lg:text-[3.25rem]"
          >
            Tradizione
            <br />
            e territorio.
          </h2>
          <p className="lede mt-5 max-w-[34rem]">
            Un viaggio nei sapori della Valle d&apos;Aosta, tra ricette della tradizione e ingredienti
            del territorio. Non c&apos;è una carta fissa: il menù del giorno si comunica in sala.
          </p>
          <ButtonLink href="#piatti" variant="dark" size="lg" className="mt-8">
            Scopri la nostra filosofia
          </ButtonLink>
        </div>

        <div data-reveal>
          <ImageReveal
            src="/images/piatto-tradizione.jpg"
            desktopSrc="/images/piatto-tradizione-desktop.jpg"
            alt="Tavola della Locanda Grauson: fontina, salumi, polenta, carbonade, seupa e una fetta di torta"
            sizes="(max-width: 767px) 100vw, 50vw"
            radius={28}
            parallax={2.5}
            className="aspect-[4/3] w-full md:aspect-[5/4]"
          >
            <div
              aria-hidden
              className="absolute inset-0 bg-[linear-gradient(to_top,rgb(18_22_16_/_0.45),transparent_48%)]"
            />
            <p className="hand hand-on-photo absolute right-5 bottom-5 max-w-[9rem] rotate-[-4deg] text-right text-[1.2rem] whitespace-pre-line text-surface/95 sm:right-7 sm:bottom-7 sm:text-[1.4rem]">
              {"La tradizione\nnel piatto."}
            </p>
          </ImageReveal>
        </div>
      </Reveal>
    </section>
  );
}
