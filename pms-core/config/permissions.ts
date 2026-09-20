import type { UserRole } from "@prisma/client";

export const PERMISSIONS = [
  "dashboard.read",
  "planning.read",
  "planning.move",
  "reservations.read",
  "reservations.write",
  "reservations.cancel",
  "reservations.checkin",
  "rooms.read",
  "rooms.write",
  "guests.read",
  "guests.write",
  "rates.read",
  "rates.write",
  "availability.read",
  "availability.write",
  "housekeeping.read",
  "housekeeping.write",
  "payments.read",
  "payments.write",
  "reports.read",
  "notifications.read",
  "notifications.write",
  "settings.read",
  "settings.write",
  "users.read",
  "users.write",
  "audit.read",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const ALL: Permission[] = [...PERMISSIONS];

const STAFF_READ: Permission[] = [
  "dashboard.read",
  "planning.read",
  "reservations.read",
  "rooms.read",
  "guests.read",
  "rates.read",
  "availability.read",
  "housekeeping.read",
  "payments.read",
  "reports.read",
  "notifications.read",
  "settings.read",
  "audit.read",
];

const FRONT_DESK: Permission[] = [
  ...STAFF_READ,
  "planning.move",
  "reservations.write",
  "reservations.cancel",
  "reservations.checkin",
  "guests.write",
  "housekeeping.write",
  "payments.write",
  "notifications.write",
];

const MANAGER: Permission[] = [
  ...FRONT_DESK,
  "rooms.write",
  "rates.write",
  "availability.write",
  "users.read",
];

const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  OWNER: ALL,
  ADMIN: ALL,
  MANAGER,
  RECEPTIONIST: FRONT_DESK,
  HOUSEKEEPING: [
    "dashboard.read",
    "planning.read",
    "rooms.read",
    "housekeeping.read",
    "housekeeping.write",
    "notifications.read",
  ],
  READ_ONLY: STAFF_READ,
};

export function can(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function permissionsFor(role: UserRole): readonly Permission[] {
  return ROLE_PERMISSIONS[role];
}
