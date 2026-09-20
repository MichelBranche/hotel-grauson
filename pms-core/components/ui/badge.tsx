import { cn } from "@pms-core/lib/utils";

const tones = {
  green: "bg-[#dce8dc] text-[#2d4230]",
  blue: "bg-[#d7e4f2] text-[#2a3d52]",
  amber: "bg-[#efe6c9] text-[#5c4a28]",
  rose: "bg-[#f3dce3] text-[#6a3340]",
  stone: "bg-[#e7e1d5] text-[#5c584f]",
  ink: "bg-[var(--pms-alpine)] text-[var(--pms-surface)]",
};

export function StatusBadge({
  label,
  tone = "stone",
  className,
}: {
  label: string;
  tone?: keyof typeof tones;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium", tones[tone], className)}>
      {label}
    </span>
  );
}
