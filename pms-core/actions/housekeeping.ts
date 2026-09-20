"use server";

import type { RoomStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { requirePermission } from "@pms-core/auth/guards";
import { wrapAction } from "@pms-core/actions/result";
import { housekeepingService } from "@pms-core/services/housekeeping.service";

export async function updateHousekeepingStatusAction(roomId: string, status: RoomStatus) {
  return wrapAction(async () => {
    const session = await requirePermission("housekeeping.write");
    await housekeepingService.setStatus(roomId, status, session.id);
    revalidatePath("/pms/housekeeping");
    revalidatePath("/pms/planning");
    return { roomId, status };
  });
}
