import type { InputHTMLAttributes, LabelHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

import { cn } from "@pms-core/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-2xl border border-[var(--pms-line)] bg-white px-3 text-sm outline-none transition-[border-color,box-shadow] placeholder:text-[var(--pms-muted)] focus:border-[var(--pms-alpine)] focus:shadow-[0_0_0_3px_rgb(38_50_41_/_0.1)]",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-24 w-full rounded-2xl border border-[var(--pms-line)] bg-white px-3 py-2.5 text-sm outline-none transition-[border-color,box-shadow] placeholder:text-[var(--pms-muted)] focus:border-[var(--pms-alpine)] focus:shadow-[0_0_0_3px_rgb(38_50_41_/_0.1)]",
        className,
      )}
      {...props}
    />
  );
}

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("mb-1.5 block text-xs text-[var(--pms-muted)]", className)} {...props} />;
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-10 w-full rounded-2xl border border-[var(--pms-line)] bg-white px-3 text-sm outline-none transition-[border-color,box-shadow] focus:border-[var(--pms-alpine)] focus:shadow-[0_0_0_3px_rgb(38_50_41_/_0.1)]",
        className,
      )}
      {...props}
    />
  );
}

export function Field({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[0.8125rem] text-[var(--pms-text)]">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-xs text-[#8a3b3b]">{error}</span> : null}
    </label>
  );
}
