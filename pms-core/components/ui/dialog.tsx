"use client";

import { Dialog as DialogPrimitive } from "radix-ui";
import type { ReactNode } from "react";

import { cn } from "@pms-core/lib/utils";

export function Dialog({
  open,
  onOpenChange,
  title,
  children,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[60] bg-[rgb(37_39_33_/_0.28)]" />
        <DialogPrimitive.Content
          className={cn(
            "fixed top-1/2 left-1/2 z-[61] w-[min(560px,calc(100vw-1.5rem))] -translate-x-1/2 -translate-y-1/2 rounded-[28px] border border-[var(--pms-line)] bg-[var(--pms-surface)] p-6 shadow-[var(--pms-shadow)]",
            className,
          )}
        >
          <DialogPrimitive.Title className="font-[family-name:var(--font-sora)] text-xl">{title}</DialogPrimitive.Title>
          <div className="mt-5">{children}</div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Conferma",
  danger,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} title={title}>
      <p className="text-sm leading-6 text-[var(--pms-muted)]">{description}</p>
      <div className="mt-6 flex justify-end gap-2">
        <button
          type="button"
          className="h-10 rounded-full px-4 text-sm hover:bg-[var(--pms-surface-dark)]"
          onClick={() => onOpenChange(false)}
        >
          Annulla
        </button>
        <button
          type="button"
          className={`h-10 rounded-full px-4 text-sm text-white ${danger ? "bg-[#8a3b3b]" : "bg-[var(--pms-alpine)]"}`}
          onClick={() => {
            onConfirm();
            onOpenChange(false);
          }}
        >
          {confirmLabel}
        </button>
      </div>
    </Dialog>
  );
}
