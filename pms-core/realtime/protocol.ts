export type LiveTopic = "reservation" | "notification";

export type LivePayload = {
  topic: LiveTopic;
  action: string;
  entityId: string | null;
  notificationType: string | null;
  title: string | null;
};

export type LiveCursor = { createdAt: Date; id: string };

/** How long one Hobby/Pro function holds the stream before the client reconnects. */
export const LIVE_STREAM_MS = 20_000;
/** Database poll when this isolate did not handle the write. */
export const LIVE_POLL_MS = 1_500;

export function readCookie(header: string | null, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const trimmed = part.trim();
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    if (trimmed.slice(0, eq) !== name) continue;
    const raw = trimmed.slice(eq + 1);
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }
  return null;
}

export function isNewerSignal(row: LiveCursor, cursor: LiveCursor) {
  const rowMs = row.createdAt.getTime();
  const cursorMs = cursor.createdAt.getTime();
  if (rowMs > cursorMs) return true;
  if (rowMs < cursorMs) return false;
  return row.id > cursor.id;
}

export function encodeLiveEvent(id: string, payload: LivePayload) {
  return `id: ${id}\ndata: ${JSON.stringify(payload)}\n\n`;
}

export function parseSseBlock(block: string): { id: string | null; payload: LivePayload | null } {
  let id: string | null = null;
  const data: string[] = [];
  for (const line of block.split(/\r?\n/)) {
    if (!line || line.startsWith(":")) continue;
    if (line.startsWith("id:")) id = line.slice(3).trim();
    else if (line.startsWith("data:")) data.push(line.slice(5).trim());
  }
  if (data.length === 0) return { id, payload: null };
  try {
    const value = JSON.parse(data.join("\n")) as Partial<LivePayload>;
    if (value.topic !== "reservation" && value.topic !== "notification") return { id, payload: null };
    if (typeof value.action !== "string") return { id, payload: null };
    return {
      id,
      payload: {
        topic: value.topic,
        action: value.action,
        entityId: typeof value.entityId === "string" ? value.entityId : null,
        notificationType: typeof value.notificationType === "string" ? value.notificationType : null,
        title: typeof value.title === "string" ? value.title : null,
      },
    };
  } catch {
    return { id, payload: null };
  }
}
