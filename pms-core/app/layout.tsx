import { redirect } from "next/navigation";

import { AppShell } from "@pms-core/components/shell/app-shell";
import { PmsProviders } from "@pms-core/components/shell/providers";
import { getSession } from "@pms-core/auth/guards";
import { notificationService } from "@pms-core/services/notification.service";
import "@pms-core/styles/pms.css";

export async function PmsConsoleLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();
  if (!user) redirect("/pms/login");
  const [items, unread] = await Promise.all([
    notificationService.list(user.propertyId),
    notificationService.unreadCount(user.propertyId),
  ]);
  return (
    <AppShell user={user} initialNotifications={items} initialUnread={unread}>
      {children}
    </AppShell>
  );
}

export function PmsRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-pms className="h-dvh overflow-hidden">
      <PmsProviders>{children}</PmsProviders>
    </div>
  );
}
