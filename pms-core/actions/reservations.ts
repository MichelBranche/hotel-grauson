"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { z } from "zod";

import type { ReservationStatus } from "@prisma/client";

import { requirePermission } from "@pms-core/auth/guards";
import { wrapAction } from "@pms-core/actions/result";
import type { Permission } from "@pms-core/config/permissions";
import type { CheckInGuestFields } from "@pms-core/lib/check-in-guest";
import { reservationService, type ReservationChange } from "@pms-core/services/reservation.service";
import type { SessionUser } from "@pms-core/types";

const staySchema = z.object({
  roomId: z.string().min(1),
  checkIn: z.string().min(10),
  checkOut: z.string().min(10),
  adults: z.number().int().min(1),
  children: z.number().int().min(0).optional(),
});

function refresh() {
  // After the response, so a layout render cannot hold the save or turn a
  // committed write into a client failure.
  try {
    after(() => {
      revalidatePath("/pms", "layout");
    });
  } catch (error) {
    console.error("Revalidate skipped after a committed reservation change.", error);
  }
}

function actor(session: SessionUser) {
  return { id: session.id, name: `${session.lastName} ${session.firstName}`, role: session.role };
}

function permissionForStatus(status: ReservationStatus): Permission {
  if (status === "CANCELLED") return "reservations.cancel";
  if (status === "CHECKED_IN" || status === "CHECKED_OUT" || status === "NO_SHOW") return "reservations.checkin";
  return "reservations.write";
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
      actor(session),
    );
    refresh();
    return reservation;
  });
}

export async function previewReservationChangeAction(input: { id: string } & ReservationChange) {
  return wrapAction(async () => {
    await requirePermission("planning.move");
    const { id, ...change } = input;
    return reservationService.previewChange(id, change);
  });
}

export async function moveReservationAction(input: { id: string } & ReservationChange) {
  return wrapAction(async () => {
    const session = await requirePermission("planning.move");
    const { id, ...change } = input;
    const reservation = await reservationService.move(id, change, actor(session));
    refresh();
    return reservation;
  });
}

export async function checkInReservationAction(id: string, guest: CheckInGuestFields) {
  return wrapAction(async () => {
    const session = await requirePermission("reservations.checkin");
    const result = await reservationService.checkIn(id, guest, actor(session));
    refresh();
    return result;
  });
}

export async function updateReservationStatusAction(
  id: string,
  status: "CHECKED_IN" | "CHECKED_OUT" | "NO_SHOW" | "CONFIRMED" | "OPTION",
  reason?: string,
) {
  return wrapAction(async () => {
    const session = await requirePermission(permissionForStatus(status));
    const result = await reservationService.updateStatus(id, status, actor(session), { reason });
    refresh();
    return result;
  });
}

export async function cancelReservationAction(input: { id: string; reason: string; force?: boolean }) {
  return wrapAction(async () => {
    const session = await requirePermission("reservations.cancel");
    const result = await reservationService.updateStatus(input.id, "CANCELLED", actor(session), {
      reason: input.reason,
      force: input.force,
    });
    refresh();
    return result;
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
    await reservationService.addPayment(input.id, input, actor(session));
    refresh();
    return { id: input.id };
  });
}

export async function addReservationExtraAction(id: string, extraId: string, quantity: number) {
  return wrapAction(async () => {
    const session = await requirePermission("reservations.write");
    await reservationService.addExtra(id, extraId, quantity, actor(session));
    refresh();
    return { id };
  });
}

export async function updateReservationNotesAction(id: string, notes: string) {
  return wrapAction(async () => {
    const session = await requirePermission("reservations.write");
    await reservationService.updateNotes(id, notes, actor(session));
    refresh();
    return { id };
  });
}
