import { can } from "@pms-core/config/permissions";
import { prisma } from "@pms-core/database/client";
import { readSession, SESSION_COOKIE } from "@pms-core/auth/session";
import { signalsSince, waitForRealtime } from "@pms-core/realtime/publish";
import { encodeLiveEvent, LIVE_POLL_MS, LIVE_STREAM_MS, readCookie, type LivePayload, type LiveTopic } from "@pms-core/realtime/protocol";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Hobby Fluid allows 60s. The handler closes earlier and the browser reconnects.
// A plan that kills the function sooner still delivers events: the client resumes
// from Last-Event-ID. WebSockets are not used: Vercel functions are request-scoped,
// the PMS only needs server → client, and Supabase's transaction pooler cannot LISTEN.
export const maxDuration = 60;

function asTopic(value: string): LiveTopic {
  return value === "notification" ? "notification" : "reservation";
}

export async function GET(request: Request) {
  const session = await readSession(readCookie(request.headers.get("cookie"), SESSION_COOKIE));
  if (!session) return new Response("Non autorizzato.", { status: 401 });
  const allowed =
    can(session.role, "planning.read") ||
    can(session.role, "reservations.read") ||
    can(session.role, "notifications.read");
  if (!allowed) return new Response("Non autorizzato.", { status: 403 });

  const propertyId = session.propertyId;
  const lastEventId = request.headers.get("last-event-id");
  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (text: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(text));
        } catch {
          closed = true;
        }
      };
      const stop = () => {
        if (closed) return;
        closed = true;
        try {
          controller.close();
        } catch {
          // The client already went away.
        }
      };
      request.signal.addEventListener("abort", stop, { once: true });

      let cursor = { id: "", createdAt: new Date(0) };
      try {
        const resumed = lastEventId
          ? await prisma.realtimeSignal.findFirst({
              where: { id: lastEventId, propertyId },
              select: { id: true, createdAt: true },
            })
          : null;
        if (resumed) {
          cursor = resumed;
        } else if (!lastEventId) {
          const latest = await prisma.realtimeSignal.findFirst({
            where: { propertyId },
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
            select: { id: true, createdAt: true },
          });
          if (latest) cursor = latest;
        } else {
          // The resume id was pruned. Replay a short window; refreshes are idempotent.
          cursor = { id: "", createdAt: new Date(Date.now() - 60_000) };
        }

        void prisma.realtimeSignal
          .deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } } })
          .catch(() => {});

        send("retry: 2000\n: connected\n\n");
        const started = Date.now();
        while (!closed && Date.now() - started < LIVE_STREAM_MS) {
          const rows = await prisma.realtimeSignal.findMany({
            where: signalsSince(propertyId, cursor),
            orderBy: [{ createdAt: "asc" }, { id: "asc" }],
            take: 50,
          });
          for (const row of rows) {
            const payload: LivePayload = {
              topic: asTopic(row.topic),
              action: row.action,
              entityId: row.entityId,
              notificationType: row.notificationType,
              title: row.title,
            };
            send(encodeLiveEvent(row.id, payload));
            cursor = { id: row.id, createdAt: row.createdAt };
          }
          if (closed || rows.length === 50) continue;
          send(": ping\n\n");
          await waitForRealtime(propertyId, LIVE_POLL_MS, request.signal);
        }
      } catch (error) {
        console.error("PMS live stream stopped.", error);
      } finally {
        stop();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "private, no-cache, no-store, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
