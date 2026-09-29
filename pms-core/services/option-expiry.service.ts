import { prisma } from "@pms-core/database/client";
import { isDomainError } from "@pms-core/lib/errors";
import { OPTION_EXPIRE_REASON, optionHoldCutoff } from "@pms-core/lib/option-hold";
import { reservationService } from "@pms-core/services/reservation.service";

const BATCH = 100;

export const optionExpiryService = {
  /**
   * Cancels OPTION stays whose hold has elapsed. Confirmed, in-house, and
   * already cancelled stays are not selected. A second run finds nothing new.
   */
  async expireAbandoned(now = new Date()) {
    const due = await prisma.reservation.findMany({
      where: { status: "OPTION", createdAt: { lte: optionHoldCutoff(now) } },
      select: { id: true, code: true },
      orderBy: { createdAt: "asc" },
      take: BATCH,
    });

    const codes: string[] = [];
    let skipped = 0;
    for (const row of due) {
      try {
        await reservationService.updateStatus(row.id, "CANCELLED", { name: "sistema" }, { reason: OPTION_EXPIRE_REASON });
        codes.push(row.code);
      } catch (error) {
        if (isDomainError(error)) {
          skipped += 1;
          continue;
        }
        throw error;
      }
    }

    return { expired: codes.length, skipped, codes };
  },
};
