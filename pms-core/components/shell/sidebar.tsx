"use client";

import {
  BedDouble,
  BookOpen,
  CalendarDays,
  CreditCard,
  LayoutDashboard,
  Radio,
  Settings,
  Sparkles,
  Tag,
  Users,
  BarChart3,
  Globe,
  Grid3x3,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MouseEvent } from "react";

import { branding } from "@pms-core/config/branding";
import { navigation } from "@pms-core/config/navigation";
import { can, type Permission } from "@pms-core/config/permissions";
import { cn } from "@pms-core/lib/utils";
import type { UserRole } from "@prisma/client";

const icons = {
  layout: LayoutDashboard,
  calendar: CalendarDays,
  book: BookOpen,
  bed: BedDouble,
  users: Users,
  tag: Tag,
  grid: Grid3x3,
  sparkles: Sparkles,
  credit: CreditCard,
  chart: BarChart3,
  globe: Globe,
  radio: Radio,
  settings: Settings,
};

export function isNavActive(pathname: string, href: string) {
  if (href === "/pms") return pathname === "/pms";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isPlainClick(event: MouseEvent) {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}

export function Sidebar({
  role,
  mobileOpen,
  collapsed,
  pendingHref,
  webRequestCount = 0,
  onNavigateStart,
  onNavigate,
}: {
  role: UserRole;
  mobileOpen?: boolean;
  collapsed?: boolean;
  pendingHref?: string | null;
  webRequestCount?: number;
  onNavigateStart?: (href: string | null) => void;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside
      id="pms-sidebar"
      className={cn(
        "pms-sidebar pms-on-dark relative z-30 flex h-dvh w-[var(--pms-sidebar)] shrink-0 flex-col overflow-hidden text-[var(--pms-surface)] max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:w-[260px] max-md:transition-transform",
        mobileOpen ? "max-md:translate-x-0" : "max-md:-translate-x-full",
      )}
    >
      <div className="absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={branding.sidebarImage}
          alt=""
          className="size-full scale-125 object-cover object-[center_35%] blur-xl"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(18_22_16_/_0.42),rgb(12_16_13_/_0.72))]" />
      </div>
      <div className="relative flex h-full flex-col px-3 py-5">
        <Link
          href="/pms/planning"
          className="pms-brand relative rounded-xl px-2"
          title={collapsed ? branding.wordmark.join(" ") : undefined}
          onClick={(event) => {
            if (isPlainClick(event)) onNavigateStart?.(isNavActive(pathname, "/pms/planning") ? null : "/pms/planning");
            onNavigate?.();
          }}
        >
          <span className="pms-brand-full block whitespace-nowrap">
            <span className="block text-[11px] font-medium tracking-[0.28em] text-white/85">{branding.wordmark[0]}</span>
            <span className="block text-[1.35rem] font-semibold leading-none tracking-[0.04em] text-white">
              {branding.wordmark[1]}
            </span>
            <span className="mt-2 block text-[10px] tracking-[0.18em] text-white/70">{branding.locationLine}</span>
          </span>
          <span
            className="pms-brand-mark absolute top-1/2 left-0 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/12 text-base font-semibold text-white shadow-[inset_0_0_0_1px_rgb(255_255_255_/_0.12)]"
            aria-hidden
          >
            {branding.wordmark[1][0]}
          </span>
        </Link>

        <nav className="mt-6 min-h-0 flex-1 space-y-1 overflow-x-hidden overflow-y-auto pms-scroll" aria-label="Navigazione PMS">
          {navigation
            .filter((item) => can(role, item.permission as Permission))
            .map((item) => {
              const Icon = icons[item.icon];
              const queue = item.href === "/pms/reservations" && webRequestCount > 0;
              const href = queue ? "/pms/reservations?coda=web" : item.href;
              const active = pendingHref ? pendingHref === href : isNavActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={href}
                  aria-current={isNavActive(pathname, item.href) ? "page" : undefined}
                  title={collapsed ? (queue ? `${item.label}, ${webRequestCount} richieste web` : item.label) : undefined}
                  onClick={(event) => {
                    if (isPlainClick(event)) onNavigateStart?.(isNavActive(pathname, item.href) ? null : href);
                    onNavigate?.();
                  }}
                  className={cn(
                    "pms-press pms-nav-link flex items-center gap-3 overflow-hidden rounded-full px-3 py-2 text-[13px] font-medium tracking-[0.01em]",
                    active
                      ? "bg-white text-[var(--pms-alpine)] shadow-[0_8px_20px_-14px_rgb(0_0_0_/_0.7)]"
                      : "bg-white/10 text-white shadow-[inset_0_0_0_1px_rgb(255_255_255_/_0.08)] backdrop-blur-sm hover:bg-white/18",
                  )}
                >
                  <Icon className="size-4 shrink-0" strokeWidth={1.7} />
                  <span className="pms-nav-label flex items-center gap-2 whitespace-nowrap">
                    {item.label}
                    {queue ? (
                      <span
                        className={cn(
                          "rounded-full px-1.5 text-[11px] tabular-nums",
                          active ? "bg-[rgb(37_39_33_/_0.08)]" : "bg-white/20",
                        )}
                      >
                        {webRequestCount}
                      </span>
                    ) : null}
                  </span>
                </Link>
              );
            })}
        </nav>
      </div>
    </aside>
  );
}
