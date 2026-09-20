"use server";

import { revalidatePath } from "next/cache";

import { requirePermission } from "@pms-core/auth/guards";
import { wrapAction } from "@pms-core/actions/result";
import { prisma } from "@pms-core/database/client";

export async function updatePropertySettingsAction(input: {
  name: string;
  address?: string;
  city: string;
  postalCode?: string;
  country: string;
  timezone: string;
  currency: string;
  language: string;
}) {
  return wrapAction(async () => {
    const session = await requirePermission("settings.write");
    await prisma.property.update({
      where: { id: session.propertyId },
      data: input,
    });
    revalidatePath("/pms/settings");
    return { ok: true };
  });
}
