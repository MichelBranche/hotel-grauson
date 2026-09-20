import { Compass } from "lucide-react";
import Link from "next/link";

import { AlpineForest } from "@/components/layout/AlpineForest";
import { Wordmark } from "@/components/layout/Wordmark";
import { FacebookIcon, InstagramIcon } from "@/components/ui/SocialIcons";
import { Reveal } from "@/components/ui/Reveal";
import { footerColumns, hotel, legalLinks } from "@/lib/content";

const socials = [
  { label: "Instagram", href: hotel.social.instagram, Icon: InstagramIcon },
  { label: "Facebook", href: hotel.social.facebook, Icon: FacebookIcon },
];

export function Footer({ pull = false, compact = false }: { pull?: boolean; compact?: boolean }) {
  return (
    <footer
      id="contatti"
      className={`on-dark relative ${
        compact
          ? "-mt-10 sm:-mt-14 lg:-mt-16"
          : `-mt-8 sm:-mt-10 ${pull ? "lg:-mt-[calc(var(--bar-travel)+2.5rem)]" : "lg:-mt-12"}`
      }`}
    >
      {/* Forest horizon: the page dissolving into the valley. The height tracks
          the width because the artwork is cropped to the band: a fixed ceiling
          would slice deeper into the ridges and treetops the wider the screen.
          30vw sits just under the panorama's own 2.97:1 ratio, so only the empty
          top of the sky is trimmed and nothing is cropped left or right. */}
      <div
        className={
          compact
            ? "relative h-[36vw] sm:h-[24vw] lg:h-[min(18vw,22rem)]"
            : "relative h-[58vw] sm:h-[38vw] lg:h-[min(30vw,50rem)]"
        }
      >
        <AlpineForest />
        {/* Clears the booking bar, which overlaps the top of the band. */}
        <p className="hand absolute top-[30%] right-[var(--gutter)] max-w-[10rem] rotate-[-3deg] text-right text-[1.15rem] leading-[1.2] text-alpine/55 sm:top-[17%] sm:text-[1.35rem]">
          Gimillan · Cogne
          <br />
          Gran Paradiso
        </p>
      </div>

      <div className="bg-alpine-deep text-surface">
        <Reveal className="shell pt-12 pb-24 sm:pt-14 lg:pb-8" y={22} stagger={0.07}>
          <div className="grid grid-cols-2 justify-items-center gap-x-6 gap-y-10 text-center lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.62fr)_minmax(0,0.62fr)_minmax(0,1fr)_auto] lg:justify-items-stretch lg:gap-x-10 lg:gap-y-12 lg:text-left">
            <div data-reveal className="col-span-2 lg:col-span-1">
              <Link href="/" className="inline-block text-surface" aria-label={`${hotel.name}, torna all'inizio`}>
                <Wordmark size="lg" />
              </Link>
            </div>

            {footerColumns.map((column) => (
              <nav key={column.heading} data-reveal aria-label={column.heading} className="lg:pt-1.5">
                <ul className="flex flex-col items-center gap-3 lg:items-start">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-[0.8125rem] text-[rgb(247_245_239_/_0.68)] transition-colors duration-400 [transition-timing-function:var(--ease-out)] hover:text-surface"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}

            <address
              data-reveal
              className="col-span-2 flex flex-col items-center gap-4 text-[0.8125rem] leading-relaxed text-[rgb(247_245_239_/_0.68)] not-italic lg:col-span-1 lg:items-start lg:border-l lg:border-[rgb(247_245_239_/_0.12)] lg:pt-1.5 lg:pl-10"
            >
              <span className="block">
                {hotel.address.street}
                <br />
                {hotel.address.postalCode} {hotel.address.city} ({hotel.address.province})
              </span>
              <span className="block">
                <a href={hotel.phoneHref} className="block transition-colors duration-400 hover:text-surface">
                  {hotel.phone}
                </a>
                <a href={`mailto:${hotel.email}`} className="block transition-colors duration-400 hover:text-surface">
                  {hotel.email}
                </a>
              </span>
            </address>

            <div data-reveal className="col-span-2 flex flex-wrap items-center justify-center gap-6 lg:col-span-1 lg:justify-start lg:pt-1">
              <ul className="flex gap-2.5">
                {socials.map(({ label, href, Icon }) => (
                  <li key={label}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noreferrer noopener"
                      aria-label={`${hotel.name} su ${label}`}
                      className="grid size-10 place-items-center rounded-full border border-[rgb(247_245_239_/_0.18)] text-[rgb(247_245_239_/_0.8)] transition-all duration-500 [transition-timing-function:var(--ease-out)] hover:border-[rgb(247_245_239_/_0.4)] hover:bg-[rgb(247_245_239_/_0.08)] hover:text-surface"
                    >
                      <Icon className="size-[17px]" />
                    </a>
                  </li>
                ))}
              </ul>

              <p className="flex items-center gap-3 border-l border-[rgb(247_245_239_/_0.12)] pl-5 text-[0.625rem] leading-[1.7] tracking-[0.13em] text-[rgb(247_245_239_/_0.6)] uppercase">
                <Compass
                  className="size-[22px] shrink-0 text-[rgb(247_245_239_/_0.45)]"
                  strokeWidth={1.1}
                  aria-hidden
                />
                <span>
                  Parco Nazionale
                  <br />
                  Gran Paradiso
                  <br />
                  Cogne · Valle d&apos;Aosta
                </span>
              </p>
            </div>
          </div>

          <div
            data-reveal
            className="mt-12 flex flex-col items-center gap-4 border-t border-[rgb(247_245_239_/_0.1)] pt-6 text-center text-[0.75rem] text-[rgb(247_245_239_/_0.5)] lg:flex-row lg:items-center lg:justify-between lg:text-left"
          >
            <p>© {new Date().getFullYear()} Locanda Grauson. Tutti i diritti riservati.</p>
            <a
              href="https://www.michelbranche.it"
              target="_blank"
              rel="noreferrer noopener"
              className="underline decoration-[rgb(247_245_239_/_0.35)] underline-offset-4 transition-colors duration-400 hover:text-surface hover:decoration-surface"
            >
              website &amp; design by michel branche
            </a>
            <ul className="flex gap-6">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="transition-colors duration-400 hover:text-surface">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </footer>
  );
}
