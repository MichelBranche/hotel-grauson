import { Shirt, ShowerHead, Sparkles, Thermometer, Wifi, PawPrint } from "lucide-react";

import { ButtonLink } from "@/components/ui/Button";
import { ImageReveal } from "@/components/ui/ImageReveal";
import { Reveal } from "@/components/ui/Reveal";

const features = [
  { icon: ShowerHead, title: "Bagno privato", detail: "con doccia" },
  { icon: Wifi, title: "Wi-Fi gratuito", detail: "in tutta la locanda" },
  { icon: Thermometer, title: "Riscaldamento", detail: "in camera" },
  { icon: Sparkles, title: "Set di cortesia", detail: "in bagno" },
  { icon: Shirt, title: "Armadio", detail: "in camera" },
  { icon: PawPrint, title: "Animali", detail: "non ammessi" },
] as const;

export function RoomsClose() {
  return (
    <section aria-labelledby="risveglio-title" className="shell mt-5 pb-8 sm:mt-6 sm:pb-12">
      <Reveal className="grid items-stretch gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(16rem,0.78fr)]" y={28} stagger={0.1}>
        <div className="grid overflow-hidden rounded-[var(--radius-panel)] bg-alpine text-surface lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
          <div data-reveal className="relative h-[18rem] sm:h-[22rem] lg:h-auto lg:min-h-[24rem]">
            <ImageReveal
              seasonal="facciata"
              sizes="(max-width: 1023px) 100vw, 40vw"
              radius={0}
              parallax={2.5}
              className="h-full"
            />
          </div>

          <div data-reveal className="flex flex-col justify-between gap-8 px-6 py-8 sm:px-8 sm:py-10 lg:order-first lg:px-10 lg:py-12">
            <div>
              <h2 id="risveglio-title" className="max-w-[12ch] text-[2.15rem] leading-[1.02] tracking-[-0.03em] sm:text-[2.6rem]">
                Un risveglio
                <br />
                con vista.
              </h2>
              <p className="mt-5 max-w-[28rem] text-[0.95rem] leading-relaxed text-surface/78 sm:text-[1.02rem]">
                Ogni camera guarda la casa e il villaggio di Gimillan. Bagno privato, Wi-Fi e
                riscaldamento, nel Parco Nazionale del Gran Paradiso.
              </p>
            </div>
            <ButtonLink href="/#la-locanda" variant="light" size="lg" className="self-start">
              Scopri la locanda
            </ButtonLink>
          </div>
        </div>

        <ul
          data-reveal
          className="grid grid-cols-2 content-center gap-x-4 gap-y-7 rounded-[var(--radius-panel)] bg-surface px-5 py-7 shadow-[var(--shadow-soft)] sm:gap-x-6 sm:px-7 sm:py-8"
        >
          {features.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.title} className="flex flex-col gap-2.5">
                <Icon className="size-[18px] text-alpine" strokeWidth={1.4} aria-hidden />
                <span>
                  <span className="block text-[0.875rem] font-medium leading-snug">{item.title}</span>
                  <span className="mt-0.5 block text-[0.75rem] leading-snug text-muted">{item.detail}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </Reveal>
    </section>
  );
}
