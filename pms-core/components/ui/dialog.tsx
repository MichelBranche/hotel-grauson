"use client";

import { X } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import type { ReactNode } from "react";

import { cn } from "@pms-core/lib/utils";

function portalContainer() {
  if (typeof document === "undefined") return undefined;
  return document.querySelector<HTMLElement>("[data-pms]") ?? undefined;
}

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  flush,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  flush?: boolean;
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal container={portalContainer()}>
        <DialogPrimitive.Overlay className="pms-dialog-overlay fixed inset-0 z-[60] bg-[rgb(37_39_33_/_0.34)]" />
        <DialogPrimitive.Content
          className={cn(
            "pms-dialog-content fixed z-[61] grid w-[min(560px,calc(100vw-1.5rem))] max-h-[min(86dvh,46rem)] grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-[28px] border border-[var(--pms-line)] bg-[var(--pms-surface)] shadow-[var(--pms-shadow)] outline-none max-sm:bottom-3 max-sm:top-auto sm:top-1/2",
            className,
          )}
        >
          <div className="relative border-b border-[var(--pms-line)] px-6 pt-6 pb-4 pr-14">
            <DialogPrimitive.Title className="pms-title text-[1.35rem] leading-tight">
              {title}
            </DialogPrimitive.Title>
            {description ? (
              <DialogPrimitive.Description className="mt-1.5 text-sm leading-6 text-[var(--pms-muted)]">
                {description}
              </DialogPrimitive.Description>
            ) : (
              <DialogPrimitive.Description className="sr-only">{title}</DialogPrimitive.Description>
            )}
            <DialogPrimitive.Close
              className="absolute top-5 right-5 grid size-9 place-items-center rounded-full text-[var(--pms-muted)] transition-colors hover:bg-[var(--pms-surface-dark)] hover:text-[var(--pms-text)]"
              aria-label="Chiudi"
            >
              <X className="size-4" strokeWidth={1.7} />
            </DialogPrimitive.Close>
          </div>
          <div className={cn("min-h-0", flush ? "grid grid-rows-[minmax(0,1fr)]" : "overflow-y-auto pms-scroll px-6 py-5")}>
            {children}
          </div>
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
    <Dialog open={open} onOpenChange={onOpenChange} title={title} description={description}>
      <div className="flex justify-end gap-2">
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
