"use server";

import { revalidatePath } from "next/cache";
import type { RoomStatus } from "@prisma/client";

import { requirePermission } from "@pms-core/auth/guards";
import { wrapAction } from "@pms-core/actions/result";
import { floorService } from "@pms-core/services/floor.service";
import { roomService } from "@pms-core/services/room.service";
import { roomTypeService } from "@pms-core/services/room-type.service";
import type { FloorInput, RoomInput, RoomTypeInput } from "@pms-core/lib/structure";

function refreshStructure() {
  revalidatePath("/pms/rooms");
  revalidatePath("/pms/planning");
  revalidatePath("/pms/availability");
  revalidatePath("/pms/housekeeping");
  revalidatePath("/pms");
}

export async function createRoomAction(input: RoomInput) {
  return wrapAction(async () => {
    const session = await requirePermission("rooms.write");
    const room = await roomService.create(session.propertyId, input, session.id);
    refreshStructure();
    return { id: room?.id, number: room?.number };
  });
}

export async function updateRoomAction(id: string, input: Partial<RoomInput>) {
  return wrapAction(async () => {
    const session = await requirePermission("rooms.write");
    const room = await roomService.update(id, input, session.id);
    refreshStructure();
    return { id: room?.id };
  });
}

export async function changeRoomTypeAction(id: string, roomTypeId: string) {
  return wrapAction(async () => {
    const session = await requirePermission("rooms.write");
    await roomService.changeType(id, roomTypeId, session.id);
    refreshStructure();
    return { id };
  });
}

export async function changeRoomFloorAction(id: string, floorId: string | null) {
  return wrapAction(async () => {
    const session = await requirePermission("rooms.write");
    await roomService.changeFloor(id, floorId, session.id);
    refreshStructure();
    return { id };
  });
}

export async function setRoomActiveAction(id: string, active: boolean) {
  return wrapAction(async () => {
    const session = await requirePermission("rooms.write");
    await roomService.setActive(id, active, session.id);
    refreshStructure();
    return { id, active };
  });
}

export async function updateRoomStatusAction(id: string, status: RoomStatus, notes?: string) {
  return wrapAction(async () => {
    const session = await requirePermission("rooms.write");
    await roomService.updateStatus(id, status, session.id, notes);
    refreshStructure();
    return { id, status };
  });
}

export async function deleteRoomAction(id: string) {
  return wrapAction(async () => {
    const session = await requirePermission("rooms.write");
    await roomService.remove(id, session.id);
    refreshStructure();
    return { id };
  });
}

export async function createRoomTypeAction(input: RoomTypeInput) {
  return wrapAction(async () => {
    const session = await requirePermission("roomTypes.write");
    const type = await roomTypeService.create(session.propertyId, input, session.id);
    refreshStructure();
    return { id: type?.id };
  });
}

export async function updateRoomTypeAction(id: string, input: Partial<RoomTypeInput>) {
  return wrapAction(async () => {
    const session = await requirePermission("roomTypes.write");
    await roomTypeService.update(id, input, session.id);
    refreshStructure();
    return { id };
  });
}

export async function duplicateRoomTypeAction(id: string) {
  return wrapAction(async () => {
    const session = await requirePermission("roomTypes.write");
    const copy = await roomTypeService.duplicate(id, session.id);
    refreshStructure();
    return { id: copy?.id };
  });
}

export async function setRoomTypeActiveAction(id: string, active: boolean) {
  return wrapAction(async () => {
    const session = await requirePermission("roomTypes.write");
    await roomTypeService.setActive(id, active, session.id);
    refreshStructure();
    return { id, active };
  });
}

export async function deleteRoomTypeAction(id: string) {
  return wrapAction(async () => {
    const session = await requirePermission("roomTypes.write");
    await roomTypeService.remove(id, session.id);
    refreshStructure();
    return { id };
  });
}

export async function createFloorAction(input: FloorInput) {
  return wrapAction(async () => {
    const session = await requirePermission("floors.write");
    const floor = await floorService.create(session.propertyId, input, session.id);
    refreshStructure();
    return { id: floor.id };
  });
}

export async function updateFloorAction(id: string, input: Partial<FloorInput>) {
  return wrapAction(async () => {
    const session = await requirePermission("floors.write");
    await floorService.update(id, input, session.id);
    refreshStructure();
    return { id };
  });
}

export async function setFloorActiveAction(id: string, active: boolean) {
  return wrapAction(async () => {
    const session = await requirePermission("floors.write");
    await floorService.setActive(id, active, session.id);
    refreshStructure();
    return { id, active };
  });
}

export async function deleteFloorAction(id: string) {
  return wrapAction(async () => {
    const session = await requirePermission("floors.write");
    await floorService.remove(id, session.id);
    refreshStructure();
    return { id };
  });
}
