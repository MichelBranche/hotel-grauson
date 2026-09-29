"use client";

import { Bell, Menu, PanelLeftClose, PanelLeftOpen, Search, Volume2, VolumeX } from "lucide-react";
import { useSyncExternalStore } from "react";

import type { SessionUser } from "@pms-core/types";
import { logoutAction } from "@pms-core/actions/auth";
import { readSoundEnabled, subscribeSound, writeSoundEnabled } from "@pms-core/lib/pms-sound";

export function Topbar({
  user,
  unread,
  onSearch,
  onNotifications,
  onMenu,
  sidebarCollapsed,
  onToggleSidebar,
}: {
  user: SessionUser;
  unread: number;
  onSearch: () => void;
  onNotifications: () => void;
  onMenu: () => void;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}) {
  const SidebarIcon = sidebarCollapsed ? PanelLeftOpen : PanelLeftClose;
  const sidebarLabel = sidebarCollapsed ? "Espandi menu" : "Comprimi menu";
  const soundOn = useSyncExternalStore(subscribeSound, readSoundEnabled, () => true);
  const SoundIcon = soundOn ? Volume2 : VolumeX;
  return (
    <header className="flex h-16 items-center gap-3 px-4 md:px-6">
      <button
        type="button"
        onClick={onMenu}
        className="pms-press grid size-10 place-items-center rounded-full hover:bg-[var(--pms-surface-dark)] md:hidden"
        aria-label="Apri menu"
      >
        <Menu className="size-5" strokeWidth={1.6} />
      </button>
      <button
        type="button"
        onClick={onToggleSidebar}
        className="pms-press hidden size-10 shrink-0 place-items-center rounded-full hover:bg-[var(--pms-surface-dark)] md:grid"
        aria-label={sidebarLabel}
        aria-controls="pms-sidebar"
        aria-expanded={!sidebarCollapsed}
        title={sidebarLabel}
      >
        <SidebarIcon className="size-5" strokeWidth={1.6} />
      </button>

      <button
        type="button"
        onClick={onSearch}
        className="flex h-11 min-w-0 flex-1 items-center gap-3 rounded-full border border-[var(--pms-line)] bg-white/70 px-4 text-left text-sm text-[var(--pms-muted)] hover:border-[rgb(37_39_33_/_0.16)] hover:bg-white"
      >
        <Search className="size-4 shrink-0" />
        <span className="truncate">Cerca prenotazione, ospite, camera…</span>
        <kbd className="ml-auto hidden rounded-md border border-[var(--pms-line)] px-1.5 py-0.5 text-[10px] md:inline">
          Ctrl K
        </kbd>
      </button>

      <button
        type="button"
        onClick={() => writeSoundEnabled(!soundOn)}
        className="pms-press grid size-10 place-items-center rounded-full hover:bg-[var(--pms-surface-dark)]"
        aria-pressed={soundOn}
        aria-label={soundOn ? "Disattiva suono notifiche" : "Attiva suono notifiche"}
        title={soundOn ? "Suono attivo" : "Suono disattivo"}
      >
        <SoundIcon className="size-4" />
      </button>

      <button
        type="button"
        onClick={onNotifications}
        className="pms-press relative grid size-10 place-items-center rounded-full hover:bg-[var(--pms-surface-dark)]"
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
          <button type="submit" className="rounded-full px-1 text-xs text-[var(--pms-muted)] underline-offset-2 hover:text-[var(--pms-text)] hover:underline">
            Esci
          </button>
        </form>
      </div>
    </header>
  );
}
