type IconProps = { className?: string; strokeWidth?: number };

/** Brand glyphs are no longer shipped by lucide-react, so they live here. */
const shared = (strokeWidth: number) => ({
  viewBox: "0 0 24 24",
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  focusable: false as const,
});

export function InstagramIcon({ className, strokeWidth = 1.5 }: IconProps) {
  return (
    <svg {...shared(strokeWidth)} className={className}>
      <rect x="2" y="2" width="20" height="20" rx="5.5" />
      <circle cx="12" cy="12" r="4" />
      <path d="M17.6 6.5h.01" />
    </svg>
  );
}

export function FacebookIcon({ className, strokeWidth = 1.5 }: IconProps) {
  return (
    <svg {...shared(strokeWidth)} className={className}>
      <path d="M18 2.5h-2.6A4.4 4.4 0 0 0 11 6.9v3.1H8.2v4H11v7.5h4V14h2.8l.7-4H15V7.3a.8.8 0 0 1 .8-.8H18z" />
    </svg>
  );
}
