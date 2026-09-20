import type { ReservationStatus, RoomStatus } from "@prisma/client";

export const reservationStatusMeta: Record<
  ReservationStatus,
  { label: string; tone: "green" | "blue" | "amber" | "rose" | "stone" | "ink"; occupies: boolean }
> = {
  INQUIRY: { label: "Richiesta", tone: "stone", occupies: false },
  OPTION: { label: "Opzione", tone: "amber", occupies: true },
  CONFIRMED: { label: "Confermata", tone: "green", occupies: true },
  CHECKED_IN: { label: "Check-in", tone: "blue", occupies: true },
  CHECKED_OUT: { label: "Check-out", tone: "stone", occupies: false },
  CANCELLED: { label: "Cancellata", tone: "rose", occupies: false },
  NO_SHOW: { label: "No-show", tone: "ink", occupies: false },
};

export const roomStatusMeta: Record<
  RoomStatus,
  { label: string; tone: "green" | "blue" | "amber" | "rose" | "stone" | "ink" }
> = {
  AVAILABLE: { label: "Disponibile", tone: "green" },
  OCCUPIED: { label: "Occupata", tone: "blue" },
  DIRTY: { label: "Da pulire", tone: "rose" },
  CLEANING: { label: "In pulizia", tone: "amber" },
  INSPECTED: { label: "Ispezionata", tone: "green" },
  OUT_OF_ORDER: { label: "Fuori servizio", tone: "ink" },
  OUT_OF_SERVICE: { label: "Manutenzione", tone: "stone" },
};

export const occupyingStatuses: ReservationStatus[] = (
  Object.entries(reservationStatusMeta) as [ReservationStatus, { occupies: boolean }][]
)
  .filter(([, meta]) => meta.occupies)
  .map(([status]) => status);

export const blockedRoomStatuses: RoomStatus[] = ["OUT_OF_ORDER", "OUT_OF_SERVICE"];
