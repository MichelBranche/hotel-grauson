"use client";

import { markNotificationsReadAction } from "@pms-core/actions/lookups";

type Item = { id: string; title: string; body: string; read: boolean; createdAt: Date | string };

export function NotificationCenter({
  open,
  items,
  onClose,
  onRead,
}: {
  open: boolean;
  items: Item[];
  onClose: () => void;
  onRead: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[65]" onClick={onClose}>
      <div
        className="absolute top-16 right-4 w-[min(380px,calc(100vw-2rem))] rounded-[24px] border border-[var(--pms-line)] bg-[var(--pms-surface)] p-4 shadow-[var(--pms-shadow)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium">Notifiche</h2>
          <button
            type="button"
            className="text-xs text-[var(--pms-muted)] underline"
            onClick={async () => {
              await markNotificationsReadAction();
              onRead();
            }}
          >
            Segna tutte lette
          </button>
        </div>
        <ul className="max-h-80 space-y-2 overflow-auto">
          {items.length === 0 ? (
            <li className="py-8 text-center text-sm text-[var(--pms-muted)]">Nessuna notifica.</li>
          ) : (
            items.map((item) => (
              <li key={item.id} className="rounded-2xl bg-white/70 px-3 py-2">
                <p className="text-sm font-medium">
                  {item.title}
                  {!item.read ? <span className="ml-2 inline-block size-1.5 rounded-full bg-[var(--pms-alpine)]" /> : null}
                </p>
                <p className="text-xs text-[var(--pms-muted)]">{item.body}</p>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
