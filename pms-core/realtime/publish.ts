import { after } from "next/server";

import { prisma } from "@pms-core/database/client";
import type { LiveCursor, LiveTopic } from "@pms-core/realtime/protocol";

export type RealtimeInput = {
  propertyId: string;
  topic: LiveTopic;
  action: string;
  entityId?: string | null;
  notificationType?: string | null;
  title?: string | null;
};

const listeners = new Map<string, Set<() => void>>();

export function subscribeRealtime(propertyId: string, onWake: () => void) {
  const set = listeners.get(propertyId) ?? new Set<() => void>();
  set.add(onWake);
  listeners.set(propertyId, set);
  return () => {
    set.delete(onWake);
    if (set.size === 0) listeners.delete(propertyId);
  };
}

function wake(propertyId: string) {
  for (const listener of listeners.get(propertyId) ?? []) listener();
}

/**
 * Writes the signal after the response so a save does not wait on it.
 * Same-process listeners wake immediately; other instances see the row on poll.
 */
export function publishRealtime(input: RealtimeInput) {
  const task = async () => {
    await prisma.realtimeSignal.create({
      data: {
        propertyId: input.propertyId,
        topic: input.topic,
        action: input.action,
        entityId: input.entityId ?? null,
        notificationType: input.notificationType ?? null,
        title: input.title ?? null,
      },
    });
    wake(input.propertyId);
  };
  try {
    after(() => task().catch((error) => console.error("Realtime signal failed.", error)));
  } catch {
    void task().catch((error) => console.error("Realtime signal failed.", error));
  }
}

export function signalsSince(propertyId: string, cursor: LiveCursor) {
  return {
    propertyId,
    OR: [
      { createdAt: { gt: cursor.createdAt } },
      { AND: [{ createdAt: cursor.createdAt }, { id: { gt: cursor.id } }] },
    ],
  };
}

export function waitForRealtime(propertyId: string, ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve) => {
    if (signal.aborted) {
      resolve();
      return;
    }
    const finish = () => {
      clearTimeout(timer);
      unsubscribe();
      signal.removeEventListener("abort", finish);
      resolve();
    };
    const timer = setTimeout(finish, ms);
    const unsubscribe = subscribeRealtime(propertyId, finish);
    signal.addEventListener("abort", finish, { once: true });
  });
}
