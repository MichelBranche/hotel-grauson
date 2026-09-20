import Link from "next/link";
import { notFound } from "next/navigation";

import { can } from "@pms-core/config/permissions";
import { requirePermission } from "@pms-core/auth/guards";
import { TypeDetailActions } from "@pms-core/components/rooms/type-detail-actions";
import { StatusBadge } from "@pms-core/components/ui/badge";
import { formatMoney } from "@pms-core/lib/money";
import { parseJson } from "@pms-core/lib/utils";
import { roomTypeService } from "@pms-core/services/room-type.service";

export default async function RoomTypeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requirePermission("roomTypes.read");
  const { id } = await params;
  const type = await roomTypeService.get(id);
  if (!type || type.propertyId !== session.propertyId) notFound();
  const amenities = parseJson<string[]>(type.amenities, []);

  return (
    <div className="space-y-5">
      <div className="pms-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs tracking-[0.16em] text-[var(--pms-muted)] uppercase">{type.code}</p>
            <h1 className="pms-title text-3xl">{type.name}</h1>
            <p className="mt-2 text-sm text-[var(--pms-muted)]">{type.description || "Nessuna descrizione."}</p>
          </div>
          <StatusBadge label={type.active ? "Attiva" : "Disattivata"} tone={type.active ? "green" : "stone"} />
        </div>
        <dl className="mt-6 grid gap-4 sm:grid-cols-4">
          <div>
            <dt className="text-xs text-[var(--pms-muted)]">Camere fisiche</dt>
            <dd className="mt-1 text-sm">{type.rooms.length}</dd>
          </div>
          <div>
            <dt className="text-xs text-[var(--pms-muted)]">Ospiti max</dt>
            <dd className="mt-1 text-sm">{type.capacity}</dd>
          </div>
          <div>
            <dt className="text-xs text-[var(--pms-muted)]">Adulti / bambini</dt>
            <dd className="mt-1 text-sm">
              {type.maxAdults} / {type.maxChildren}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-[var(--pms-muted)]">Prezzo base</dt>
            <dd className="mt-1 text-sm">{formatMoney(type.basePrice)}</dd>
          </div>
        </dl>
        <p className="mt-4 text-sm text-[var(--pms-muted)]">
          {type.sizeM2 ? `${type.sizeM2} m² · ` : ""}
          {type.beds || "Configurazione letti non indicata"}
          {type.bathroom ? ` · ${type.bathroom}` : ""}
        </p>
        {amenities.length ? <p className="mt-2 text-sm">{amenities.join(" · ")}</p> : null}
      </div>

      {can(session.role, "roomTypes.write") ? (
        <TypeDetailActions
          type={{
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
            amenities,
            images: parseJson<string[]>(type.images, []),
            basePrice: type.basePrice,
            active: type.active,
            sortOrder: type.sortOrder,
            roomCount: type.rooms.length,
          }}
        />
      ) : null}

      <section className="pms-card overflow-hidden">
        <div className="px-6 pt-5">
          <h2 className="text-sm text-[var(--pms-muted)]">Camere assegnate</h2>
        </div>
        <ul className="mt-2 divide-y divide-[var(--pms-line)]">
          {type.rooms.map((room) => (
            <li key={room.id}>
              <Link href={`/pms/rooms/${room.id}`} className="flex items-center justify-between px-6 py-3 text-sm">
                <span>{room.number}</span>
                <span className="text-[var(--pms-muted)]">{room.assignedFloor?.displayName ?? "Senza piano"}</span>
              </Link>
            </li>
          ))}
          {type.rooms.length === 0 ? (
            <li className="px-6 py-5 text-sm text-[var(--pms-muted)]">Nessuna camera fisica assegnata.</li>
          ) : null}
        </ul>
      </section>

      <section className="pms-card p-6">
        <h2 className="text-sm text-[var(--pms-muted)]">Tariffe collegate</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {type.ratePrices.map((price) => (
            <li key={price.id} className="flex justify-between">
              <span>
                {price.ratePlan.name} · {price.ratePlan.code}
              </span>
              <span>{formatMoney(price.basePrice)}</span>
            </li>
          ))}
          {type.ratePrices.length === 0 ? (
            <li className="text-[var(--pms-muted)]">Nessun rate plan collegato. Il prezzo base viene usato come fallback.</li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
