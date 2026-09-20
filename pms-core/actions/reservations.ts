"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requirePermission } from "@pms-core/auth/guards";
import { wrapAction } from "@pms-core/actions/result";
import { reservationService } from "@pms-core/services/reservation.service";

const staySchema = z.object({
  roomId: z.string().min(1),
  checkIn: z.string().min(10),
  checkOut: z.string().min(10),
  adults: z.number().int().min(1),
  children: z.number().int().min(0).optional(),
});

function refresh() {
  revalidatePath("/pms", "layout");
}

export async function createReservationAction(input: {
  roomId: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children?: number;
  guest: {
    id?: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    country?: string;
    vip?: boolean;
  };
  ratePlanId?: string;
  extras?: { extraId: string; quantity: number }[];
  notes?: string;
  payment?: { amount: number; method: "CASH" | "CARD" | "BANK_TRANSFER" | "ONLINE" | "OTHER" };
}) {
  return wrapAction(async () => {
    const session = await requirePermission("reservations.write");
    staySchema.parse(input);
    const reservation = await reservationService.create(
      { ...input, propertyId: session.propertyId, source: "pms" },
      { id: session.id, name: `${session.lastName} ${session.firstName}` },
    );
    refresh();
    return { id: reservation?.id, code: reservation?.code };
  });
}

export async function moveReservationAction(input: {
  id: string;
  roomId: string;
  checkIn: string;
  checkOut: string;
  adults?: number;
  children?: number;
}) {
  return wrapAction(async () => {
    const session = await requirePermission("planning.move");
    const reservation = await reservationService.move(input.id, input, { id: session.id });
    refresh();
    return {
      id: reservation?.id,
      roomId: reservation?.roomId,
      checkIn: reservation?.checkIn,
      checkOut: reservation?.checkOut,
    };
  });
}

export async function updateReservationStatusAction(id: string, status: "CHECKED_IN" | "CHECKED_OUT" | "CANCELLED" | "NO_SHOW" | "CONFIRMED") {
  return wrapAction(async () => {
    const permission = status === "CANCELLED" ? "reservations.cancel" : "reservations.checkin";
    const session = await requirePermission(permission);
    await reservationService.updateStatus(id, status, { id: session.id });
    refresh();
    return { id, status };
  });
}

export async function addReservationPaymentAction(input: {
  id: string;
  amount: number;
  method: "CASH" | "CARD" | "BANK_TRANSFER" | "ONLINE" | "OTHER";
  note?: string;
}) {
  return wrapAction(async () => {
    const session = await requirePermission("payments.write");
    await reservationService.addPayment(input.id, input, { id: session.id });
    refresh();
    return { id: input.id };
  });
}

export async function addReservationExtraAction(id: string, extraId: string, quantity: number) {
  return wrapAction(async () => {
    const session = await requirePermission("reservations.write");
    await reservationService.addExtra(id, extraId, quantity, { id: session.id });
    refresh();
    return { id };
  });
}

export async function updateReservationNotesAction(id: string, notes: string) {
  return wrapAction(async () => {
    const session = await requirePermission("reservations.write");
    await reservationService.updateNotes(id, notes, { id: session.id });
    refresh();
    return { id };
  });
}
