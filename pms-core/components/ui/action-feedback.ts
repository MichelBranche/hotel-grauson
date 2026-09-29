"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";

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
