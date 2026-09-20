import { ButtonLink } from "@/components/ui/Button";
import { ImageReveal } from "@/components/ui/ImageReveal";
import { Reveal } from "@/components/ui/Reveal";
import { getRoom } from "@/lib/rooms";

const balcony = getRoom("balcone");

export function RoomBalconyChapter() {
  return (
    <section aria-labelledby="balcone-title" className="shell mt-5 sm:mt-7">
      <Reveal
        className="grid items-center gap-3 sm:gap-4 lg:grid-cols-[1.05fr_1.2fr]"
        y={30}
        stagger={0.12}
      >
        <div data-reveal className="flex flex-col justify-between gap-8 px-1 py-4 lg:py-8">
          <div>
            <p className="eyebrow flex items-center gap-3 text-muted">
              {balcony?.index} · Con balcone
              <span aria-hidden className="h-px w-12 bg-[rgb(37_39_33_/_0.16)]" />
            </p>
            <h2 id="balcone-title" className="display-lg mt-5">
              Camera matrimoniale
              <br />
              con balcone
            </h2>
            <p className="lede mt-5 max-w-[32rem]">
              12 m², 2 ospiti, letto matrimoniale e balcone sulla facciata. Stessi servizi delle
              altre camere: bagno privato, Wi-Fi, riscaldamento.
            </p>
          </div>

          <ButtonLink href="/camere/balcone" variant="quiet" size="lg" className="self-start">
            La matrimoniale con balcone
          </ButtonLink>
        </div>

        <div data-reveal>
          <ImageReveal
            seasonal="facciata"
            sizes="(max-width: 1023px) 92vw, 55vw"
            radius={26}
            className="aspect-[4/3] w-full sm:aspect-[16/10]"
          >
            <div
              aria-hidden
              className="absolute inset-x-0 bottom-0 h-2/5 bg-[linear-gradient(to_top,rgb(18_22_16_/_0.5),transparent)]"
            />
            <p className="hand hand-on-photo absolute right-6 bottom-5 max-w-[10rem] rotate-[-3deg] text-right text-[1.15rem] leading-[1.15] text-surface/92 sm:text-[1.3rem]">
              Balcone
            </p>
          </ImageReveal>
        </div>
      </Reveal>
    </section>
  );
}
