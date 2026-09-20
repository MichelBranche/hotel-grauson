import { notFound } from "next/navigation";

import { requirePermission } from "@pms-core/auth/guards";
import { roomService } from "@pms-core/services/room.service";
import { roomStatusMeta } from "@pms-core/config/status";
import { StatusBadge } from "@pms-core/components/ui/badge";

export default async function RoomDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("rooms.read");
  const { id } = await params;
  const room = await roomService.get(id);
  if (!room) notFound();

  return (
    <div className="pms-card max-w-xl p-6">
      <div className="flex items-center justify-between">
        <h1 className="font-[family-name:var(--font-sora)] text-3xl">Camera {room.number}</h1>
        <StatusBadge label={roomStatusMeta[room.status].label} tone={roomStatusMeta[room.status].tone} />
      </div>
      <p className="mt-3 text-sm text-[var(--pms-muted)]">
        {room.roomType.name} · piano {room.floor} · {room.capacity} ospiti · {room.beds}
      </p>
      <p className="mt-4 text-sm">{room.notes || "Nessuna nota operativa."}</p>
    </div>
  );
}
