"use server";

import { revalidatePath } from "next/cache";

import { requirePermission } from "@pms-core/auth/guards";
import { wrapAction } from "@pms-core/actions/result";
import type { ClosureInput, RatePlanInput, SeasonInput } from "@pms-core/lib/rates";
import { closureService } from "@pms-core/services/closure.service";
import { rateService } from "@pms-core/services/rate.service";

function refreshSales() {
  revalidatePath("/pms/rates");
  revalidatePath("/pms/availability");
  revalidatePath("/pms/planning");
}

export async function createDefaultRatePlanAction() {
  return wrapAction(async () => {
    const session = await requirePermission("rates.write");
    const plan = await rateService.ensureDefaultPlan(session.propertyId, session.id);
    refreshSales();
    return { id: plan.id };
  });
}

export async function createRatePlanAction(input: RatePlanInput) {
  return wrapAction(async () => {
    const session = await requirePermission("rates.write");
    const plan = await rateService.createPlan(session.propertyId, input, session.id);
    refreshSales();
    return { id: plan.id };
  });
}

export async function updateRatePlanAction(id: string, input: RatePlanInput) {
  return wrapAction(async () => {
    const session = await requirePermission("rates.write");
    await rateService.updatePlan(session.propertyId, id, input, session.id);
    refreshSales();
    return { id };
  });
}

export async function deleteRatePlanAction(id: string) {
  return wrapAction(async () => {
    const session = await requirePermission("rates.write");
    await rateService.deletePlan(session.propertyId, id, session.id);
    refreshSales();
    return { id };
  });
}

export async function setRatePlanPricesAction(id: string, prices: { roomTypeId: string; basePrice: number | null }[]) {
  return wrapAction(async () => {
    const session = await requirePermission("rates.write");
    await rateService.setPlanPrices(session.propertyId, id, prices, session.id);
    refreshSales();
    return { id };
  });
}

export async function createSeasonAction(input: SeasonInput) {
  return wrapAction(async () => {
    const session = await requirePermission("rates.write");
    const season = await rateService.createSeason(session.propertyId, input, session.id);
    refreshSales();
    return { id: season.id };
  });
}

export async function updateSeasonAction(id: string, input: SeasonInput) {
  return wrapAction(async () => {
    const session = await requirePermission("rates.write");
    await rateService.updateSeason(session.propertyId, id, input, session.id);
    refreshSales();
    return { id };
  });
}

export async function deleteSeasonAction(id: string) {
  return wrapAction(async () => {
    const session = await requirePermission("rates.write");
    await rateService.deleteSeason(session.propertyId, id, session.id);
    refreshSales();
    return { id };
  });
}

export async function createClosureAction(input: ClosureInput) {
  return wrapAction(async () => {
    const session = await requirePermission("availability.write");
    const result = await closureService.create(session.propertyId, input, session.id);
    refreshSales();
    return result;
  });
}

export async function reopenRoomTypeAction(roomTypeId: string, startDate: string, endDate: string) {
  return wrapAction(async () => {
    const session = await requirePermission("availability.write");
    await closureService.reopenRoomType(session.propertyId, roomTypeId, startDate, endDate, session.id);
    refreshSales();
    return { roomTypeId };
  });
}

export async function updateRoomBlockAction(id: string, input: { startDate: string; endDate: string; reason?: string }) {
  return wrapAction(async () => {
    const session = await requirePermission("availability.write");
    await closureService.updateBlock(session.propertyId, id, input, session.id);
    refreshSales();
    return { id };
  });
}

export async function deleteRoomBlockAction(id: string) {
  return wrapAction(async () => {
    const session = await requirePermission("availability.write");
    await closureService.deleteBlock(session.propertyId, id, session.id);
    refreshSales();
    return { id };
  });
}
