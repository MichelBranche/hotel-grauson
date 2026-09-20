import Link from "next/link";
import { notFound } from "next/navigation";

import { can } from "@pms-core/config/permissions";
import { requirePermission } from "@pms-core/auth/guards";
import { occupyingStatuses, roomStatusMeta } from "@pms-core/config/status";
import { RoomDetailActions } from "@pms-core/components/rooms/room-detail-actions";
import { StatusBadge } from "@pms-core/components/ui/badge";
import { formatMoney } from "@pms-core/lib/money";
import { toISODate } from "@pms-core/lib/dates";
import { guestDisplay, parseJson } from "@pms-core/lib/utils";
import { roomService } from "@pms-core/services/room.service";

export default async function RoomDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requirePermission("rooms.read");
  const { id } = await params;
  const [room, types, floors] = await Promise.all([
    roomService.get(id),
    roomService.types(session.propertyId),
    roomService.floors(session.propertyId),
  ]);
  if (!room || room.propertyId !== session.propertyId) notFound();

  const now = new Date();
  const current = room.reservations.find(
    (item) => occupyingStatuses.includes(item.status) && item.checkIn <= now && item.checkOut > now,
  );
  const upcoming = room.reservations.filter((item) => item.checkOut > now && item.id !== current?.id);
  const latestHousekeeping = room.housekeepingTasks[0];
  const displayPrice = room.customBasePrice ?? room.roomType.basePrice;

  return (
    <div className="space-y-5">
      <div className="pms-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs tracking-[0.16em] text-[var(--pms-muted)] uppercase">Camera</p>
            <h1 className="font-[family-name:var(--font-sora)] text-3xl">ROOM {room.number}</h1>
            <p className="mt-2 text-sm text-[var(--pms-muted)]">
              {room.roomType.name} · {room.assignedFloor?.displayName ?? "Senza piano"}
            </p>
          </div>
          <div className="flex gap-2">
            <StatusBadge label={roomStatusMeta[room.status].label} tone={roomStatusMeta[room.status].tone} />
            <StatusBadge label={room.active ? "Attiva" : "Disattivata"} tone={room.active ? "green" : "stone"} />
          </div>
        </div>

        <dl className="mt-6 grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs text-[var(--pms-muted)]">Stato</dt>
            <dd className="mt-1 text-sm">{roomStatusMeta[room.status].label}</dd>
          </div>
          <div>
            <dt className="text-xs text-[var(--pms-muted)]">Capienza</dt>
            <dd className="mt-1 text-sm">{room.capacity} ospiti</dd>
          </div>
          <div>
            <dt className="text-xs text-[var(--pms-muted)]">Prezzo base</dt>
            <dd className="mt-1 text-sm">{formatMoney(displayPrice)}</dd>
          </div>
        </dl>
        <p className="mt-4 text-sm">{room.notes || "Nessuna nota operativa."}</p>
      </div>

      <section className="pms-card p-6">
        <h2 className="text-sm text-[var(--pms-muted)]">Azioni</h2>
        <div className="mt-4">
          <RoomDetailActions
            canWrite={can(session.role, "rooms.write")}
            room={{
              id: room.id,
              number: room.number,
              name: room.name,
              floor: room.floor,
              floorId: room.floorId,
              floorName: room.assignedFloor?.displayName ?? null,
              capacity: room.capacity,
              status: room.status,
              notes: room.notes,
              active: room.active,
              customBasePrice: room.customBasePrice,
              roomTypeId: room.roomTypeId,
              roomTypeName: room.roomType.name,
              roomTypeCode: room.roomType.code,
              displayPrice,
            }}
            types={types.map((type) => ({
              id: type.id,
              name: type.name,
              code: type.code,
              description: type.description,
              capacity: type.capacity,
              maxAdults: type.maxAdults,
              maxChildren: type.maxChildren,
              sizeM2: type.sizeM2,
              beds: type.beds,
              bathroom: type.bathroom,
              amenities: parseJson<string[]>(type.amenities, []),
              images: parseJson<string[]>(type.images, []),
              basePrice: type.basePrice,
              active: type.active,
              sortOrder: type.sortOrder,
              roomCount: type._count.rooms,
            }))}
            floors={floors.map((floor) => ({
              id: floor.id,
              name: floor.name,
              displayName: floor.displayName,
              sortOrder: floor.sortOrder,
              description: floor.description,
              active: floor.active,
              roomCount: floor._count.rooms,
            }))}
          />
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="pms-card p-6">
          <h2 className="text-sm text-[var(--pms-muted)]">Prenotazione in corso</h2>
          {current ? (
            <Link href={`/pms/reservations/${current.id}`} className="mt-3 block">
              <p className="font-medium">{guestDisplay(current.guest.firstName, current.guest.lastName)}</p>
              <p className="text-sm text-[var(--pms-muted)]">
                {current.code} · {toISODate(current.checkIn)} → {toISODate(current.checkOut)}
              </p>
            </Link>
          ) : (
            <p className="mt-3 text-sm text-[var(--pms-muted)]">Nessun ospite in casa.</p>
          )}
        </section>
        <section className="pms-card p-6">
          <h2 className="text-sm text-[var(--pms-muted)]">Housekeeping</h2>
          <p className="mt-3 text-sm">{roomStatusMeta[room.status].label}</p>
          {latestHousekeeping ? (
            <p className="mt-1 text-xs text-[var(--pms-muted)]">
              Ultimo aggiornamento {latestHousekeeping.updatedAt.toLocaleString("it-IT")}
              {latestHousekeeping.notes ? ` · ${latestHousekeeping.notes}` : ""}
            </p>
          ) : null}
        </section>
      </div>

      <section className="pms-card overflow-hidden">
        <div className="px-6 pt-5">
          <h2 className="text-sm text-[var(--pms-muted)]">Prossime prenotazioni</h2>
        </div>
        {upcoming.length === 0 ? (
          <p className="px-6 py-5 text-sm text-[var(--pms-muted)]">Nessuna prenotazione futura su questa camera.</p>
        ) : (
          <table className="mt-2 w-full text-left text-sm">
            <thead className="text-xs text-[var(--pms-muted)]">
              <tr>
                <th className="px-6 py-3">Codice</th>
                <th className="px-4 py-3">Ospite</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {upcoming.map((reservation) => (
                <tr key={reservation.id} className="border-t border-[var(--pms-line)]">
                  <td className="px-6 py-3">
                    <Link href={`/pms/reservations/${reservation.id}`}>{reservation.code}</Link>
                  </td>
                  <td className="px-4 py-3">{guestDisplay(reservation.guest.firstName, reservation.guest.lastName)}</td>
                  <td className="px-4 py-3">
                    {toISODate(reservation.checkIn)} → {toISODate(reservation.checkOut)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
