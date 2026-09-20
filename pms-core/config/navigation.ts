import type { Permission } from "@pms-core/config/permissions";

export type NavItem = {
  href: string;
  label: string;
  icon:
    | "layout"
    | "calendar"
    | "book"
    | "bed"
    | "users"
    | "tag"
    | "grid"
    | "sparkles"
    | "credit"
    | "chart"
    | "globe"
    | "radio"
    | "settings";
  permission: Permission;
};

export const navigation: NavItem[] = [
  { href: "/pms", label: "Dashboard", icon: "layout", permission: "dashboard.read" },
  { href: "/pms/planning", label: "Planning", icon: "calendar", permission: "planning.read" },
  { href: "/pms/reservations", label: "Prenotazioni", icon: "book", permission: "reservations.read" },
  { href: "/pms/rooms", label: "Camere", icon: "bed", permission: "rooms.read" },
  { href: "/pms/guests", label: "Ospiti", icon: "users", permission: "guests.read" },
  { href: "/pms/rates", label: "Tariffe", icon: "tag", permission: "rates.read" },
  { href: "/pms/availability", label: "Disponibilità", icon: "grid", permission: "availability.read" },
  { href: "/pms/housekeeping", label: "Housekeeping", icon: "sparkles", permission: "housekeeping.read" },
  { href: "/pms/payments", label: "Pagamenti", icon: "credit", permission: "payments.read" },
  { href: "/pms/reports", label: "Report", icon: "chart", permission: "reports.read" },
  { href: "/pms/booking-engine", label: "Booking engine", icon: "globe", permission: "reservations.read" },
  { href: "/pms/channels", label: "Canali OTA", icon: "radio", permission: "settings.read" },
  { href: "/pms/settings", label: "Impostazioni", icon: "settings", permission: "settings.read" },
];
