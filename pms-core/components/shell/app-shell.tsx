"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";

import { getNotificationsAction } from "@pms-core/actions/lookups";
import { CommandPalette } from "@pms-core/components/shell/command-palette";
import { NotificationCenter } from "@pms-core/components/shell/notification-center";
import { PmsLive } from "@pms-core/components/shell/pms-live";
import { Sidebar } from "@pms-core/components/shell/sidebar";
import { Topbar } from "@pms-core/components/shell/topbar";
import { hearWebRequests } from "@pms-core/lib/pms-sound";
import {
  applySidebarAttr,
  readSidebarCollapsed,
  subscribeSidebarCollapsed,
  writeSidebarCollapsed,
} from "@pms-core/lib/sidebar-pref";
import type { SessionUser } from "@pms-core/types";

type Note = {
  id: string;
  type?: string | null;
  title: string;
  body: string;
  read: boolean;
  createdAt: Date;
  entity?: string | null;
  entityId?: string | null;
};

export function AppShell({
  user,
  children,
  initialNotifications,
  initialUnread,
  webRequestCount = 0,
}: {
  user: SessionUser;
  children: ReactNode;
  initialNotifications: Note[];
  initialUnread: number;
  webRequestCount?: number;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [unread, setUnread] = useState(initialUnread);
  const pathname = usePathname();
  const [pending, setPending] = useState<{ href: string; from: string } | null>(null);
  // Pending only while we are still on the page the click came from; once the
  // router commits the new pathname it clears itself without an effect.
  const pendingHref = pending && pending.from === pathname ? pending.href : null;
  const collapsed = useSyncExternalStore(subscribeSidebarCollapsed, readSidebarCollapsed, () => false);

  // The rail's look is CSS on an <html> attribute (set pre-paint by the boot
  // script); keep it in sync with storage, including other tabs.
  useEffect(() => {
    const sync = () => applySidebarAttr(readSidebarCollapsed());
    sync();
    return subscribeSidebarCollapsed(sync);
  }, []);

  useEffect(() => {
    hearWebRequests(notifications);
  }, [notifications]);

  async function refreshNotes() {
    const result = await getNotificationsAction();
    if (result.ok) {
      setNotifications(result.data.items);
      setUnread(result.data.unread);
    }
  }

  return (
    <div className="flex h-dvh overflow-hidden">
      <Sidebar
        role={user.role}
        mobileOpen={menuOpen}
        collapsed={collapsed}
        pendingHref={pendingHref}
        webRequestCount={webRequestCount}
        onNavigateStart={(href) => setPending(href ? { href, from: pathname } : null)}
        onNavigate={() => setMenuOpen(false)}
      />
      {menuOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-20 bg-black/30 md:hidden"
          aria-label="Chiudi menu"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="pms-progress" data-active={pendingHref ? "true" : "false"} aria-hidden />
        <Topbar
          user={user}
          unread={unread}
          onSearch={() => setSearchOpen(true)}
          onNotifications={() => setNotesOpen(true)}
          onMenu={() => setMenuOpen((value) => !value)}
          sidebarCollapsed={collapsed}
          onToggleSidebar={() => writeSidebarCollapsed(!collapsed)}
        />
        <main className="min-h-0 flex-1 overflow-auto overscroll-contain pms-scroll px-4 pb-6 md:px-6" aria-busy={pendingHref ? true : undefined}>
          <div key={pathname} className="pms-page-in">
            {children}
          </div>
        </main>
      </div>
      <PmsLive onActivity={() => void refreshNotes()} />
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
