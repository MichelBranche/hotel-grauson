"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";

type ActionSuccess<T> = { ok: true; data: T };
type ActionFailure = { ok: false; error: string };
export type SettledAction<T> = ActionSuccess<T> | ActionFailure | { ok: true; committed: true };

export function isRenderGlitch(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const digest = "digest" in error ? String(error.digest ?? "") : "";
  if (digest.startsWith("NEXT_REDIRECT") || digest.includes("NEXT_HTTP_ERROR_FALLBACK") || digest === "NEXT_NOT_FOUND") {
    return false;
  }
  const message = error instanceof Error ? error.message : "";
  return /Server Components render|Minified React error #441|omitted in production builds|max clients reached|EMAXCONNSESSION|Cannot read properties of (null|undefined)/i.test(
    message,
  );
}

/** Runs a server action. A post-commit RSC failure is not a failed save. */
export async function settleAction<T>(task: () => Promise<ActionSuccess<T> | ActionFailure>): Promise<SettledAction<T>> {
  try {
    return await task();
  } catch (error) {
    if (!isRenderGlitch(error)) throw error;
    console.error("Reservation save committed, but the follow-up render failed.", error);
    return { ok: true, committed: true };
  }
}

export function reportAction(id: string, result: { ok: true } | { ok: false; error: string }, success: string) {
  if (result.ok) toast.success(success, { id });
  else toast.error(result.error, { id });
  return result.ok;
}

export function useActionPending() {
  const lock = useRef(false);
  const [pending, setPending] = useState<string | null>(null);

  async function run<T>(key: string, task: () => Promise<T>): Promise<T | undefined> {
    if (lock.current) return undefined;
    lock.current = true;
    setPending(key);
    try {
      return await task();
    } finally {
      lock.current = false;
      setPending(null);
    }
  }

  return { pending, run };
}
