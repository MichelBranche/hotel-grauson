import Link from "next/link";

import { requirePermission } from "@pms-core/auth/guards";
import { DeleteGuestButton } from "@pms-core/components/guests/delete-guest-button";
import { can } from "@pms-core/config/permissions";
import { guestService } from "@pms-core/services/guest.service";
import { guestDisplay } from "@pms-core/lib/utils";

export default async function GuestsPage() {
  const session = await requirePermission("guests.read");
  const guests = await guestService.list(session.propertyId);
  const canWrite = can(session.role, "guests.write");

  return (
    <div>
      <h1 className="text-2xl">Ospiti</h1>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {guests.map((guest) => {
          const name = guestDisplay(guest.firstName, guest.lastName);
          return (
            <div key={guest.id} className="pms-card p-4">
              <Link href={`/pms/guests/${guest.id}`} className="block">
                <p className="font-medium">{name}</p>
                <p className="text-sm text-[var(--pms-muted)]">{guest.email ?? guest.phone ?? guest.country}</p>
              </Link>
              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-xs text-[var(--pms-muted)]">{guest.reservations.length} soggiorni</p>
                {canWrite ? <DeleteGuestButton id={guest.id} name={name} /> : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
