"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { installRscFlightTracker, whenRscIdle } from "@pms-core/lib/rsc-flight";
import { parseSseBlock, type LiveClientDetail, type LiveTopic } from "@pms-core/realtime/protocol";

const RETRY_MS = 2_000;

/**
 * Authenticated live stream for the open PMS session. Reservation events reload
 * the visible Planning board, then refresh the server tree (KPIs, lists, bell).
 * The refresh waits until that reload — and any in-flight server action — has
 * finished, so the two RSC payloads are not applied together.
 */
export function PmsLive() {
  const router = useRouter();
  const routerRef = useRef(router);

  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  useEffect(() => {
    installRscFlightTracker();
    const abort = new AbortController();
    let stopped = false;
    let lastId: string | null = null;
    let timer: number | undefined;
    let sawReservation = false;

    const flush = () => {
      const reservation = sawReservation;
      sawReservation = false;
      whenRscIdle(() => {
        const tracked: Promise<unknown>[] = [];
        if (reservation) {
          const detail: LiveClientDetail = {
            topic: "reservation",
            track(work) {
              tracked.push(work);
            },
          };
          window.dispatchEvent(new CustomEvent("pms:live", { detail }));
        }
        void Promise.all(tracked).finally(() => {
          whenRscIdle(() => {
            routerRef.current.refresh();
          });
        });
      });
    };

    const schedule = (topic: LiveTopic) => {
      if (topic === "reservation") sawReservation = true;
      window.clearTimeout(timer);
      timer = window.setTimeout(flush, 200);
    };

    async function pump() {
      while (!stopped) {
        try {
          const headers = new Headers({ Accept: "text/event-stream" });
          if (lastId) headers.set("Last-Event-ID", lastId);
          const response = await fetch("/api/pms/events", {
            headers,
            signal: abort.signal,
            cache: "no-store",
          });
          if (response.status === 401 || response.status === 403) return;
          if (!response.ok || !response.body) throw new Error("live unavailable");
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";
          while (!stopped) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const blocks = buffer.split(/\n\n/);
            buffer = blocks.pop() ?? "";
            for (const block of blocks) {
              const parsed = parseSseBlock(block);
              if (parsed.id) lastId = parsed.id;
              if (parsed.payload) schedule(parsed.payload.topic);
            }
          }
        } catch {
          if (abort.signal.aborted) return;
        }
        if (stopped) return;
        await new Promise((resolve) => window.setTimeout(resolve, RETRY_MS));
      }
    }

    void pump();
    return () => {
      stopped = true;
      abort.abort();
      window.clearTimeout(timer);
    };
  }, []);

  return null;
}
