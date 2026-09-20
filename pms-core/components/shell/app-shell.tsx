"use client";

import { useState, type ReactNode } from "react";

import { getNotificationsAction } from "@pms-core/actions/lookups";
import { CommandPalette } from "@pms-core/components/shell/command-palette";
import { NotificationCenter } from "@pms-core/components/shell/notification-center";
import { Sidebar } from "@pms-core/components/shell/sidebar";
import { Topbar } from "@pms-core/components/shell/topbar";
import type { SessionUser } from "@pms-core/types";

type Note = { id: string; title: string; body: string; read: boolean; createdAt: Date };

export function AppShell({
  user,
  children,
  initialNotifications,
  initialUnread,
}: {
  user: SessionUser;
  children: ReactNode;
  initialNotifications: Note[];
  initialUnread: number;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [unread, setUnread] = useState(initialUnread);

  async function refreshNotes() {
    const result = await getNotificationsAction();
    if (result.ok) {
      setNotifications(result.data.items);
      setUnread(result.data.unread);
    }
  }

  return (
    <div className="flex min-h-dvh">
      <Sidebar role={user.role} mobileOpen={menuOpen} onNavigate={() => setMenuOpen(false)} />
      {menuOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-20 bg-black/30 md:hidden"
          aria-label="Chiudi menu"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          user={user}
          unread={unread}
          onSearch={() => setSearchOpen(true)}
          onNotifications={() => setNotesOpen(true)}
          onMenu={() => setMenuOpen((value) => !value)}
        />
        <main className="min-h-0 flex-1 overflow-auto pms-scroll px-4 pb-6 md:px-6">{children}</main>
      </div>
      <CommandPalette open={searchOpen} onOpenChange={setSearchOpen} />
      <NotificationCenter
        open={notesOpen}
        items={notifications}
        onClose={() => setNotesOpen(false)}
        onRead={() => void refreshNotes()}
      />
    </div>
  );
}
