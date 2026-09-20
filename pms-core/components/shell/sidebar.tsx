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
        <img src={branding.sidebarImage} alt="" className="size-full object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(20_26_21_/_0.45),rgb(15_20_16_/_0.78))]" />
      </div>
      <div className="relative flex h-full flex-col px-3 py-5">
        <Link href="/pms/planning" className="px-2" onClick={onNavigate}>
          <p className="font-[family-name:var(--font-sora)] text-[11px] tracking-[0.28em] text-white/70">
            {branding.wordmark[0]}
          </p>
          <p className="font-[family-name:var(--font-sora)] text-[1.35rem] leading-none tracking-wide">
            {branding.wordmark[1]}
          </p>
          <p className="mt-2 text-[10px] tracking-[0.18em] text-white/55">{branding.locationLine}</p>
        </Link>

        <nav className="mt-6 flex-1 space-y-0.5 overflow-auto pms-scroll" aria-label="Navigazione PMS">
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
                    "flex items-center gap-3 rounded-full px-3 py-1.5 text-[13px] transition-colors",
                    active ? "bg-white text-[var(--pms-alpine)]" : "text-white/80 hover:bg-white/10 hover:text-white",
                  )}
                >
                  <Icon className="size-4 shrink-0" strokeWidth={1.6} />
                  {item.label}
                </Link>
              );
            })}
        </nav>
      </div>
    </aside>
  );
}
