"use client";

import { Bell, Menu, Search } from "lucide-react";

import type { SessionUser } from "@pms-core/types";
import { logoutAction } from "@pms-core/actions/auth";

export function Topbar({
  user,
  unread,
  onSearch,
  onNotifications,
  onMenu,
}: {
  user: SessionUser;
  unread: number;
  onSearch: () => void;
  onNotifications: () => void;
  onMenu: () => void;
}) {
  return (
    <header className="flex h-16 items-center gap-3 px-4 md:px-6">
      <button
        type="button"
        onClick={onMenu}
        className="grid size-10 place-items-center rounded-full hover:bg-[var(--pms-surface-dark)]"
        aria-label="Apri menu"
      >
        <Menu className="size-5" strokeWidth={1.6} />
      </button>

      <button
        type="button"
        onClick={onSearch}
        className="flex h-11 min-w-0 flex-1 items-center gap-3 rounded-full border border-[var(--pms-line)] bg-white/70 px-4 text-left text-sm text-[var(--pms-muted)]"
      >
        <Search className="size-4 shrink-0" />
        <span className="truncate">Cerca prenotazione, ospite, camera…</span>
        <kbd className="ml-auto hidden rounded-md border border-[var(--pms-line)] px-1.5 py-0.5 text-[10px] md:inline">
          Ctrl K
        </kbd>
      </button>

      <button
        type="button"
        onClick={onNotifications}
        className="relative grid size-10 place-items-center rounded-full hover:bg-[var(--pms-surface-dark)]"
        aria-label="Notifiche"
      >
        <Bell className="size-4" />
        {unread > 0 ? (
          <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-[var(--pms-alpine)]" />
        ) : null}
      </button>

      <div className="flex items-center gap-2">
        <span className="grid size-9 place-items-center rounded-full bg-[var(--pms-alpine)] text-xs text-[var(--pms-surface)]">
          {user.firstName[0]}
          {user.lastName[0]}
        </span>
        <span className="hidden leading-tight md:block">
          <span className="block text-sm font-medium">
            {user.firstName} {user.lastName}
          </span>
          <span className="block text-[11px] text-[var(--pms-muted)]">Amministratore</span>
        </span>
        <form action={logoutAction}>
          <button type="submit" className="text-xs text-[var(--pms-muted)] underline-offset-2 hover:underline">
            Esci
          </button>
        </form>
      </div>
    </header>
  );
}
