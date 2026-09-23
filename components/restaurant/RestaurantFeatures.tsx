import { CookingPot, Flame, Leaf, Sprout, Wine } from "lucide-react";

const features = [
  { icon: Leaf, label: "Ingredienti locali" },
  { icon: CookingPot, label: "Cucina tradizionale" },
  { icon: Wine, label: "Vini valdostani" },
  { icon: Sprout, label: "Piatti di stagione" },
  { icon: Flame, label: "Atmosfera autentica" },
] as const;

export function RestaurantFeatures() {
  return (
    <section aria-label="La cucina della locanda" className="shell mt-4 sm:mt-5">
      <ul className="grid grid-cols-5 gap-1 rounded-[var(--radius-panel)] bg-surface px-2 py-4 shadow-[var(--shadow-soft)] sm:gap-2 sm:px-4 sm:py-5">
        {features.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.label} className="flex min-w-0 flex-col items-center gap-2 text-center">
              <Icon className="size-[18px] shrink-0 text-alpine sm:size-5" strokeWidth={1.4} aria-hidden />
              <span className="text-[0.62rem] leading-tight text-ink/75 sm:text-[0.75rem]">{item.label}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
