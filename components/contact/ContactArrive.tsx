import { ImageReveal } from "@/components/ui/ImageReveal";
import { Reveal } from "@/components/ui/Reveal";
import { journeys } from "@/lib/contact";
import { hotel } from "@/lib/content";

export function ContactArrive() {
  return (
    <section aria-labelledby="arrivo-title" className="shell mt-5 sm:mt-7">
      <Reveal className="grid items-stretch gap-3 sm:gap-4 lg:grid-cols-[1fr_1.15fr]" y={30} stagger={0.12}>
        <div data-reveal>
          <ImageReveal
            seasonal="cogne"
            sizes="(max-width: 1023px) 92vw, 48vw"
            radius={26}
            className="aspect-[4/5] h-full min-h-[20rem] w-full sm:aspect-[16/11] lg:aspect-auto lg:min-h-[32rem]"
          >
            <div
              aria-hidden
              className="absolute inset-x-0 bottom-0 h-2/5 bg-[linear-gradient(to_top,rgb(18_22_16_/_0.55),transparent)]"
            />
            <p className="hand hand-on-photo absolute bottom-5 left-6 text-[1.15rem] leading-[1.15] text-surface/92 sm:text-[1.3rem]">
              La valle
              <br />
              di Cogne
            </p>
          </ImageReveal>
        </div>

        <div
          data-reveal
          className="flex flex-col justify-between gap-10 rounded-[var(--radius-card)] bg-surface px-6 py-8 shadow-[var(--shadow-soft)] sm:px-9 sm:py-10"
        >
          <div>
            <p className="eyebrow flex items-center gap-3 text-muted">
              Come arrivare
              <span aria-hidden className="h-px w-12 bg-[rgb(37_39_33_/_0.16)]" />
            </p>
            <h2 id="arrivo-title" className="display-lg mt-5">
              Dalla pianura
              <br />
              a {hotel.hamlet}
            </h2>
            <p className="lede mt-5 max-w-[30rem]">
              Si lascia l’autostrada ad Aosta e si entra in valle. La locanda è nella frazione, a{" "}
              {hotel.altitude}.
            </p>
          </div>

          <ol className="flex flex-col gap-7 border-t border-[rgb(37_39_33_/_0.07)] pt-7">
            {journeys.map((item) => (
              <li key={item.index} className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1">
                <span className="eyebrow pt-0.5 text-muted">{item.index}</span>
                <h3 className="font-serif text-[1.45rem] leading-none tracking-[-0.02em]">{item.title}</h3>
                <p className="col-start-2 text-[0.9rem] leading-relaxed text-ink/75">{item.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </Reveal>
    </section>
  );
}
