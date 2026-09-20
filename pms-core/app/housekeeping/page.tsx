import { requirePermission } from "@pms-core/auth/guards";
import { HousekeepingBoard } from "@pms-core/components/housekeeping/board";
import { housekeepingService } from "@pms-core/services/housekeeping.service";

export default async function HousekeepingPage() {
  const session = await requirePermission("housekeeping.read");
  const rooms = await housekeepingService.board(session.propertyId);

  return (
    <div>
      <h1 className="font-[family-name:var(--font-sora)] text-2xl">Housekeeping</h1>
      <p className="mt-1 text-sm text-[var(--pms-muted)]">Stato camere, priorità e aggiornamenti rapidi</p>
      <div className="mt-5">
        <HousekeepingBoard rooms={rooms} />
      </div>
    </div>
  );
}
