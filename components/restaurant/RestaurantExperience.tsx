import { Armchair, ArrowRight, Mountain, UtensilsCrossed, Wine } from "lucide-react";
import Image from "next/image";

import { Reveal } from "@/components/ui/Reveal";
import { hotel } from "@/lib/content";

const highlights = [
  { icon: Armchair, title: "Sala interna accogliente", detail: "Ambiente caldo e familiare." },
  { icon: Mountain, title: "Terrazza", detail: "Vista sul villaggio di Gimillan." },
  { icon: UtensilsCrossed, title: "Menù di stagione", detail: "Piatti con ingredienti locali." },
  { icon: Wine, title: "Vini del territorio", detail: "In sala, accanto alla cucina." },
] as const;

export function RestaurantExperience() {
  return (
    <section id="tavolo" aria-labelledby="esperienza-title" className="shell mt-5 scroll-mt-28 pb-8 sm:mt-6 sm:pb-12">
      <Reveal className="grid items-stretch gap-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(16rem,0.72fr)]" y={28} stagger={0.1}>
        <div data-reveal className="relative min-h-[24rem] overflow-hidden rounded-[var(--radius-panel)] bg-alpine text-surface sm:min-h-[26rem]">
          <Image
            src="/images/sala-ristorante.jpg"
            alt="Sala da pranzo in legno della Locanda Grauson, con i tavoli apparecchiati e la luce del legno"
            fill
            sizes="(max-width: 1023px) 100vw, 62vw"
            className="object-cover object-[center_55%]"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-[linear-gradient(100deg,rgb(18_22_16_/_0.82)_0%,rgb(18_22_16_/_0.55)_42%,rgb(18_22_16_/_0.18)_100%)]"
          />
          <div className="relative flex h-full min-h-[24rem] flex-col justify-end gap-6 px-6 py-8 sm:min-h-[26rem] sm:px-10 sm:py-10 lg:max-w-[28rem] lg:px-12">
            <div>
              <h2
                id="esperienza-title"
                className="max-w-[12ch] text-[2.15rem] leading-[1.02] tracking-[-0.03em] text-surface sm:text-[2.6rem]"
              >
                Un&apos;esperienza
                <br />
                da vivere.
              </h2>
              <p className="mt-4 max-w-[24rem] text-[0.95rem] leading-relaxed text-surface/80 sm:text-[1.02rem]">
                Più di un pasto, un momento da ricordare. Pranzo e cena si prenotano per telefono.
              </p>
            </div>
            <a
              href={hotel.phoneHref}
              className="arrow-parent group inline-flex h-[3.125rem] w-fit items-center justify-center gap-2.5 rounded-full bg-surface px-6 text-[0.8125rem] font-medium text-ink shadow-[0_10px_24px_-18px_rgb(37_39_33_/_0.5)] transition-colors duration-500 [transition-timing-function:var(--ease-out)] hover:bg-white"
            >
              <span>Prenota un tavolo</span>
              <ArrowRight className="arrow-slide size-[15px] shrink-0" strokeWidth={1.6} aria-hidden />
            </a>
          </div>
        </div>

        <ul
          data-reveal
          className="grid grid-cols-2 content-center gap-x-4 gap-y-7 rounded-[var(--radius-panel)] bg-surface px-5 py-7 shadow-[var(--shadow-soft)] sm:gap-x-6 sm:px-7 sm:py-8"
        >
          {highlights.map((item) => {
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
