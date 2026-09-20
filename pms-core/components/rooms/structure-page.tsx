import Link from "next/link";

import { FloorList } from "@pms-core/components/rooms/floor-list";
import { RoomList } from "@pms-core/components/rooms/room-list";
import { TypeList } from "@pms-core/components/rooms/type-list";
import type { StructureFloor, StructurePermissions, StructureRoom, StructureType } from "@pms-core/components/rooms/types";
import { cn } from "@pms-core/lib/utils";

const tabs = [
  { id: "types", label: "Tipologie" },
  { id: "rooms", label: "Camere" },
  { id: "floors", label: "Piani" },
] as const;

type Tab = (typeof tabs)[number]["id"];

export function StructurePage({
  rooms,
  types,
  floors,
  permissions,
  initialTab,
}: {
  rooms: StructureRoom[];
  types: StructureType[];
  floors: StructureFloor[];
  permissions: StructurePermissions;
  initialTab?: string;
}) {
  const tab = (tabs.some((item) => item.id === initialTab) ? initialTab : "rooms") as Tab;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-sora)] text-2xl">Camere</h1>
        <p className="mt-1 text-sm text-[var(--pms-muted)]">
          Struttura della property: tipologie, camere fisiche e piani. I prezzi di vendita restano sui rate plan.
        </p>
      </div>

      <div role="tablist" aria-label="Struttura camere" className="flex gap-1 rounded-full bg-[var(--pms-surface-dark)] p-1">
        {tabs.map((item) => (
          <Link
            key={item.id}
            href={`/pms/rooms?tab=${item.id}`}
            role="tab"
            aria-selected={tab === item.id}
            className={cn(
              "flex-1 rounded-full px-4 py-2 text-center text-sm",
              tab === item.id ? "bg-[var(--pms-alpine)] text-[var(--pms-surface)]" : "text-[var(--pms-text)]",
            )}
          >
            {item.label}
          </Link>
        ))}
      </div>

      {tab === "types" ? <TypeList types={types} canWrite={permissions.roomTypes} /> : null}
      {tab === "rooms" ? <RoomList rooms={rooms} types={types} floors={floors} canWrite={permissions.rooms} /> : null}
      {tab === "floors" ? <FloorList floors={floors} canWrite={permissions.floors} /> : null}
    </div>
  );
}
