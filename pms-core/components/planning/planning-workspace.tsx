"use client";

import { useRef } from "react";

import { PlanningBoard, type PlanningBoardHandle } from "@pms-core/components/planning/planning-board";
import { OccupancyWidget } from "@pms-core/components/planning/side-widgets";
import type { DeskPermissions } from "@pms-core/components/reservations/lifecycle-actions";
import type { RecentStay } from "@pms-core/lib/recent-stays";
import type { PlanningData } from "@pms-core/types";

export function PlanningWorkspace({
  initial,
  extras,
  plans,
  permissions,
  businessToday,
  canSetRoomStatus,
  roomStatusVia,
  occupancy,
  free,
  cleaning,
  recent,
  initialFocus,
}: {
  initial: PlanningData;
  extras: { id: string; name: string; price: number }[];
  plans: { id: string; code: string; name: string }[];
  permissions: DeskPermissions;
  businessToday: string;
  canSetRoomStatus: boolean;
  roomStatusVia: "rooms" | "housekeeping";
  occupancy: number;
  free: number;
  cleaning: number;
  recent: RecentStay[];
  initialFocus?: { id: string; checkIn?: string } | null;
}) {
  const boardRef = useRef<PlanningBoardHandle>(null);

  return (
    <>
      <PlanningBoard
        ref={boardRef}
        initial={initial}
        extras={extras}
        plans={plans}
        permissions={permissions}
        businessToday={businessToday}
        canSetRoomStatus={canSetRoomStatus}
        roomStatusVia={roomStatusVia}
        initialFocus={initialFocus}
      />
      <OccupancyWidget
        occupancy={occupancy}
        free={free}
        cleaning={cleaning}
        recent={recent}
        onSelectRecent={(stay) => boardRef.current?.focusStay(stay.id, stay.checkIn, stay.status)}
      />
    </>
  );
}
