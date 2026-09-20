"use client";

import { toast } from "sonner";
import { useState } from "react";

import { updateHousekeepingStatusAction } from "@pms-core/actions/housekeeping";
import { roomStatusMeta } from "@pms-core/config/status";
import { StatusBadge } from "@pms-core/components/ui/badge";
import type { RoomStatus } from "@prisma/client";

const actions: { status: RoomStatus; label: string }[] = [
  { status: "DIRTY", label: "Dirty" },
  { status: "CLEANING", label: "Cleaning" },
  { status: "AVAILABLE", label: "Clean" },
  { status: "INSPECTED", label: "Inspected" },
];

type Row = {
  id: string;
  number: string;
  status: RoomStatus;
  notes: string;
  roomType: { name: string };
  housekeepingTasks: { id: string; updatedAt: Date; notes: string; assignee: { firstName: string; lastName: string } | null }[];
};

export function HousekeepingBoard({ rooms }: { rooms: Row[] }) {
  const [rows, setRows] = useState(rooms);

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {rows.map((room) => {
        const latest = room.housekeepingTasks[0];
        return (
          <article key={room.id} className="pms-card p-4">
            <div className="flex items-center justify-between">
              <p className="font-[family-name:var(--font-sora)] text-xl">{room.number}</p>
              <StatusBadge label={roomStatusMeta[room.status].label} tone={roomStatusMeta[room.status].tone} />
            </div>
            <p className="mt-1 text-sm text-[var(--pms-muted)]">{room.roomType.name}</p>
            <p className="mt-2 text-xs text-[var(--pms-muted)]">
              {latest?.assignee ? `${latest.assignee.firstName} ${latest.assignee.lastName}` : "Non assegnata"}
              {latest ? ` · ${new Date(latest.updatedAt).toLocaleString("it-IT")}` : ""}
            </p>
            <p className="mt-2 text-sm">{room.notes || latest?.notes || "—"}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {actions.map((action) => (
                <button
                  key={action.status}
                  type="button"
                  className="h-8 rounded-full border border-[var(--pms-line)] px-3 text-xs"
                  onClick={async () => {
                    const previous = room.status;
                    setRows((current) => current.map((item) => (item.id === room.id ? { ...item, status: action.status } : item)));
                    const result = await updateHousekeepingStatusAction(room.id, action.status);
                    if (!result.ok) {
                      setRows((current) => current.map((item) => (item.id === room.id ? { ...item, status: previous } : item)));
                      toast.error(result.error);
                    } else {
                      toast.success(`Camera ${room.number} aggiornata.`);
                    }
                  }}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </article>
        );
      })}
    </div>
  );
}
