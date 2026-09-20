import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

type Variant = "dark" | "light" | "quiet";

const base =
  "arrow-parent group inline-flex items-center justify-center gap-2.5 rounded-full text-[0.8125rem] font-medium tracking-[0.005em] transition-[background-color,color,box-shadow,border-color] duration-500 [transition-timing-function:var(--ease-out)]";

const variants: Record<Variant, string> = {
  dark: "bg-accent text-surface hover:bg-accent-hover shadow-[0_10px_24px_-16px_rgb(38_50_41_/_0.8)]",
  light: "bg-surface text-ink hover:bg-white shadow-[0_10px_24px_-18px_rgb(37_39_33_/_0.5)]",
  quiet:
    "border border-[rgb(37_39_33_/_0.12)] bg-transparent text-ink hover:border-[rgb(37_39_33_/_0.3)] hover:bg-[rgb(37_39_33_/_0.03)]",
};

const sizes = {
  md: "h-10 px-4",
  lg: "h-[3.125rem] px-6",
} as const;

type ButtonProps = {
  children: ReactNode;
  variant?: Variant;
  size?: keyof typeof sizes;
  withArrow?: boolean;
  className?: string;
};

function content(children: ReactNode, withArrow: boolean) {
  return (
    <>
      <span>{children}</span>
      {withArrow ? (
        <ArrowRight className="arrow-slide size-[15px] shrink-0" strokeWidth={1.6} aria-hidden />
      ) : null}
    </>
  );
}

export function ButtonLink({
  href,
  children,
  variant = "dark",
  size = "md",
  withArrow = true,
  className = "",
  ...rest
}: ButtonProps & { href: string } & Omit<ComponentPropsWithoutRef<"a">, "className" | "children">) {
  return (
    <Link href={href} className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...rest}>
      {content(children, withArrow)}
    </Link>
  );
}

export function Button({
  children,
  variant = "dark",
  size = "md",
  withArrow = true,
  className = "",
  ...rest
}: ButtonProps & Omit<ComponentPropsWithoutRef<"button">, "className" | "children">) {
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...rest}>
      {content(children, withArrow)}
    </button>
  );
}

/** Circular arrow affordance used on the feature cards. */
export function ArrowCircle({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`grid size-[2.375rem] shrink-0 place-items-center rounded-full bg-surface/95 text-ink transition-colors duration-500 [transition-timing-function:var(--ease-out)] group-hover:bg-white ${className}`}
    >
      <ArrowRight className="arrow-slide size-4" strokeWidth={1.6} />
    </span>
  );
}
