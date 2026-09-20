import type { LucideIcon } from "lucide-react";

export function KpiCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <article className="pms-kpi flex min-w-[11rem] items-center gap-3 px-4 py-3">
      <span className="grid size-10 place-items-center rounded-full bg-[#edf3ec] text-[var(--pms-alpine)]">
        <Icon className="size-4" strokeWidth={1.6} />
      </span>
      <span>
        <span className="block font-[family-name:var(--font-sora)] text-xl leading-none">{value}</span>
        <span className="mt-1 block text-xs text-[var(--pms-muted)]">
          {label}
          {hint ? ` · ${hint}` : ""}
        </span>
      </span>
    </article>
  );
}
