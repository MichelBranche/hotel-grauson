import Link from "next/link";

import { requirePermission } from "@pms-core/auth/guards";
import { guestService } from "@pms-core/services/guest.service";
import { guestDisplay } from "@pms-core/lib/utils";

export default async function GuestsPage() {
  const session = await requirePermission("guests.read");
  const guests = await guestService.list(session.propertyId);

  return (
    <div>
      <h1 className="font-[family-name:var(--font-sora)] text-2xl">Ospiti</h1>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {guests.map((guest) => (
          <Link key={guest.id} href={`/pms/guests/${guest.id}`} className="pms-card p-4">
            <p className="font-medium">{guestDisplay(guest.firstName, guest.lastName)}</p>
            <p className="text-sm text-[var(--pms-muted)]">{guest.email ?? guest.phone ?? guest.country}</p>
            <p className="mt-2 text-xs text-[var(--pms-muted)]">{guest.reservations.length} soggiorni</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
