import Link from "next/link";

import { requirePermission } from "@pms-core/auth/guards";
import { roomStatusMeta } from "@pms-core/config/status";
import { StatusBadge } from "@pms-core/components/ui/badge";
import { roomService } from "@pms-core/services/room.service";

export default async function RoomsPage() {
  const session = await requirePermission("rooms.read");
  const [rooms, types] = await Promise.all([roomService.list(session.propertyId), roomService.types(session.propertyId)]);

  return (
    <div className="space-y-6">
      <h1 className="font-[family-name:var(--font-sora)] text-2xl">Camere</h1>
      <div className="grid gap-3 md:grid-cols-3">
        {types.map((type) => (
          <article key={type.id} className="pms-card p-4">
            <p className="font-medium">{type.name}</p>
            <p className="text-sm text-[var(--pms-muted)]">{type._count.rooms} camere · {type.capacity} ospiti</p>
          </article>
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {rooms.map((room) => (
          <Link key={room.id} href={`/pms/rooms/${room.id}`} className="pms-card p-4">
            <div className="flex items-center justify-between">
              <p className="font-[family-name:var(--font-sora)] text-xl">{room.number}</p>
              <StatusBadge label={roomStatusMeta[room.status].label} tone={roomStatusMeta[room.status].tone} />
            </div>
            <p className="mt-2 text-sm text-[var(--pms-muted)]">
              {room.roomType.name} · piano {room.floor} · {room.capacity} ospiti
            </p>
            {room.notes ? <p className="mt-2 text-xs text-[var(--pms-muted)]">{room.notes}</p> : null}
          </Link>
        ))}
      </div>
    </div>
  );
}
