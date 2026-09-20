import { unstable_rethrow } from "next/navigation";

import { isDomainError } from "@pms-core/lib/errors";

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

export async function wrapAction<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (error) {
    unstable_rethrow(error);
    const message = isDomainError(error)
      ? error.message
      : error instanceof Error
        ? error.message
        : "Operazione non riuscita.";
    return { ok: false, error: message };
  }
}
