import Link from "next/link";

import { Reveal } from "@/components/ui/Reveal";
import { hotel } from "@/lib/content";

export function ContactWrite() {
  return (
    <section aria-labelledby="scrivere-title" className="shell mt-5 sm:mt-7">
      <Reveal>
        <div
          data-reveal
          className="on-dark relative overflow-hidden rounded-[var(--radius-panel)] bg-alpine-deep px-6 py-12 text-surface sm:px-10 sm:py-16 lg:px-16"
        >
          <p className="hand absolute top-8 right-[var(--gutter)] hidden max-w-[8rem] rotate-[-3deg] text-right text-[1.25rem] text-surface/45 md:block">
            Reception
          </p>

          <p className="eyebrow flex items-center gap-3 text-surface/55">
            Una camera o un tavolo
            <span aria-hidden className="h-px w-12 bg-surface/20" />
          </p>
          <h2 id="scrivere-title" className="display-lg mt-5 max-w-[16ch]">
            Vi confermiamo noi
          </h2>
          <p className="mt-5 max-w-[32rem] text-[0.975rem] leading-[1.62] text-surface/65">
            Per le notti si chiedono le date. Per il ristorante, un telefono. Non è un pagamento
            online.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-5">
            <a
              href={hotel.phoneHref}
              className="inline-flex h-[3.125rem] items-center justify-center rounded-full bg-surface px-6 text-[0.8125rem] font-medium text-ink shadow-[0_10px_24px_-18px_rgb(37_39_33_/_0.5)] transition-colors duration-500 [transition-timing-function:var(--ease-out)] hover:bg-white"
            >
              {hotel.phone}
            </a>
            <Link
              href="/booking"
              className="text-[0.8125rem] text-surface/70 underline decoration-surface/25 underline-offset-4 transition-colors duration-400 hover:text-surface hover:decoration-surface"
            >
              Le vostre notti
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
