import { Reveal } from "@/components/ui/Reveal";
import { kitchenDishes } from "@/lib/restaurant";

export function RestaurantMenu() {
  return (
    <section id="cucina" aria-labelledby="cucina-title" className="shell mt-5 scroll-mt-28 sm:mt-7">
      <Reveal className="rounded-[var(--radius-panel)] bg-surface px-6 py-10 shadow-[var(--shadow-soft)] sm:px-10 sm:py-14 lg:px-16 lg:py-16">
        <div data-reveal className="max-w-[38rem]">
          <p className="eyebrow flex items-center gap-3 text-muted">
            La cucina
            <span aria-hidden className="h-px w-12 bg-[rgb(37_39_33_/_0.16)]" />
          </p>
          <h2 id="cucina-title" className="display-lg mt-5">
            Cucina cogneintse
          </h2>
          <p className="lede mt-5">
            Non è prevista una carta fissa. Piatti della tradizione locale, secondo stagione e
            dispensa. Il menù si chiede in sala.
          </p>
        </div>

        <ol className="mt-12 flex flex-col">
          {kitchenDishes.map((dish) => (
            <li
              key={dish.index}
              data-reveal
              className="grid grid-cols-[auto_1fr] items-baseline gap-x-6 gap-y-2 border-t border-[rgb(37_39_33_/_0.08)] py-8 last:pb-0 sm:grid-cols-[4.5rem_minmax(0,0.9fr)_minmax(0,1.1fr)] sm:gap-x-10 sm:py-10"
            >
              <span className="text-[0.6875rem] font-medium tracking-[0.14em] text-muted">
                {dish.index}
              </span>
              <h3 className="font-serif text-[1.85rem] leading-none tracking-[-0.02em] sm:text-[2.15rem]">
                {dish.name}
              </h3>
              <p className="col-start-2 max-w-[28rem] text-[0.9375rem] leading-relaxed text-muted sm:col-start-auto">
                {dish.line}
              </p>
            </li>
          ))}
        </ol>
      </Reveal>
    </section>
  );
}
