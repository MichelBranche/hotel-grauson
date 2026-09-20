"use server";

import { revalidatePath } from "next/cache";

import { requirePermission } from "@pms-core/auth/guards";
import { wrapAction } from "@pms-core/actions/result";
import { guestService } from "@pms-core/services/guest.service";

export async function createGuestAction(input: {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  country?: string;
  notes?: string;
  vip?: boolean;
}) {
  return wrapAction(async () => {
    const session = await requirePermission("guests.write");
    const guest = await guestService.create({ ...input, propertyId: session.propertyId }, session.id);
    revalidatePath("/pms/guests");
    return { id: guest.id };
  });
}

export async function updateGuestAction(
  id: string,
  input: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    country?: string;
    notes?: string;
    vip?: boolean;
  },
) {
  return wrapAction(async () => {
    const session = await requirePermission("guests.write");
    await guestService.update(id, input, session.id);
    revalidatePath("/pms/guests");
    revalidatePath(`/pms/guests/${id}`);
    return { id };
  });
}
