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

export function Sidebar({
  role,
  mobileOpen,
  onNavigate,
}: {
  role: UserRole;
  mobileOpen?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "relative z-30 flex h-dvh w-[var(--pms-sidebar)] shrink-0 flex-col overflow-hidden text-[var(--pms-surface)] max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:w-[260px] max-md:transition-transform",
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
        <Link href="/pms/planning" className="px-2" onClick={onNavigate}>
          <p className="font-[family-name:var(--font-sora)] text-[11px] tracking-[0.28em] text-white/85">
            {branding.wordmark[0]}
          </p>
          <p className="font-[family-name:var(--font-sora)] text-[1.35rem] leading-none tracking-wide text-white">
            {branding.wordmark[1]}
          </p>
          <p className="mt-2 text-[10px] tracking-[0.18em] text-white/70">{branding.locationLine}</p>
        </Link>

        <nav className="mt-6 min-h-0 flex-1 space-y-1 overflow-auto pms-scroll" aria-label="Navigazione PMS">
          {navigation
            .filter((item) => can(role, item.permission as Permission))
            .map((item) => {
              const Icon = icons[item.icon];
              const active = item.href === "/pms" ? pathname === "/pms" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 rounded-full px-3 py-2 text-[13px] font-medium tracking-[0.01em] transition-colors",
                    active
                      ? "bg-white text-[var(--pms-alpine)] shadow-[0_8px_20px_-14px_rgb(0_0_0_/_0.7)]"
                      : "bg-white/10 text-white shadow-[inset_0_0_0_1px_rgb(255_255_255_/_0.08)] backdrop-blur-sm hover:bg-white/18",
                  )}
                >
                  <Icon className="size-4 shrink-0" strokeWidth={1.7} />
                  {item.label}
                </Link>
              );
            })}
        </nav>
      </div>
    </aside>
  );
}
