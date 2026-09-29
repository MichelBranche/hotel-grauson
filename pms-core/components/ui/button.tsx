import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";

import { cn } from "@pms-core/lib/utils";

const buttonVariants = cva(
  "pms-press inline-flex items-center justify-center gap-2 rounded-full text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pms-alpine)] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--pms-alpine)] text-[var(--pms-surface)] shadow-[0_6px_16px_-12px_rgb(38_50_41_/_0.8)] hover:bg-[var(--pms-green-soft)] hover:shadow-[0_10px_22px_-14px_rgb(38_50_41_/_0.9)]",
        outline: "border border-[var(--pms-line)] bg-transparent text-[var(--pms-text)] hover:bg-[var(--pms-surface-dark)]",
        ghost: "text-[var(--pms-text)] hover:bg-[var(--pms-surface-dark)]",
        danger: "bg-[#8a3b3b] text-white hover:bg-[#733232]",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-8 px-3 text-xs",
        lg: "h-11 px-5",
        icon: "size-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export function Button({
  className,
  variant,
  size,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
