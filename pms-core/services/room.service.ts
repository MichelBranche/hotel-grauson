import type { RoomStatus } from "@prisma/client";

import { prisma } from "@pms-core/database/client";
import { roomRepo, type RoomListFilters } from "@pms-core/database/repositories/room.repo";
import { occupyingStatuses } from "@pms-core/config/status";
import { DomainError } from "@pms-core/lib/errors";
import { roomInputSchema, type RoomInput } from "@pms-core/lib/structure";
import { auditService } from "@pms-core/services/audit.service";

function roomSnapshot(room: {
  number: string;
  name: string | null;
  roomTypeId: string;
  floorId: string | null;
  floor: number;
  capacity: number;
  status: RoomStatus;
  notes: string;
  customBasePrice: number | null;
  active: boolean;
}) {
  return {
    number: room.number,
    name: room.name,
    roomTypeId: room.roomTypeId,
    floorId: room.floorId,
    floor: room.floor,
    capacity: room.capacity,
    status: room.status,
    notes: room.notes,
    customBasePrice: room.customBasePrice,
    active: room.active,
  };
}

async function assertUniqueNumber(propertyId: string, number: string, excludeId?: string) {
  const existing = await prisma.room.findFirst({
    where: { propertyId, number, ...(excludeId ? { id: { not: excludeId } } : {}) },
  });
  if (existing) {
    throw new DomainError(`Esiste già una camera con numero «${number}» in questa struttura.`);
  }
}

async function assertUniqueName(propertyId: string, name: string | null | undefined, excludeId?: string) {
  const value = name?.trim();
  if (!value) return;
  const existing = await prisma.room.findFirst({
    where: { propertyId, name: value, ...(excludeId ? { id: { not: excludeId } } : {}) },
  });
  if (existing) {
    throw new DomainError(`Esiste già una camera con nome «${value}» in questa struttura.`);
  }
}

async function resolveFloorIndex(floorId?: string | null) {
  if (!floorId) return 0;
  const floor = await prisma.floor.findUnique({ where: { id: floorId } });
  if (!floor) throw new DomainError("Il piano selezionato non esiste.");
  return floor.sortOrder;
}

async function assertAssignableType(propertyId: string, roomTypeId: string) {
  const type = await prisma.roomType.findFirst({ where: { id: roomTypeId, propertyId } });
  if (!type) throw new DomainError("La tipologia selezionata non esiste.");
  if (!type.active) throw new DomainError("Non è possibile assegnare una tipologia disattivata.");
  return type;
}

async function assertCapacityAgainstReservations(roomId: string, capacity: number) {
  const future = await prisma.reservation.findMany({
    where: {
      roomId,
      status: { in: occupyingStatuses },
      checkOut: { gt: new Date() },
    },
    select: { adults: true, children: true, code: true },
  });
  const overflow = future.find((item) => item.adults + item.children > capacity);
  if (overflow) {
    throw new DomainError(
      `La capienza ${capacity} è inferiore agli ospiti della prenotazione ${overflow.code}. Le prenotazioni esistenti restano valide: aumenta la capienza oppure lascia invariata.`,
    );
  }
}

export const roomService = {
  list: roomRepo.list,
  listFiltered(propertyId: string, filters?: RoomListFilters) {
    return roomRepo.list(propertyId, filters);
  },
  get: roomRepo.get,
  types: roomRepo.types,
  floors: roomRepo.floors,

  async create(propertyId: string, raw: RoomInput, userId?: string) {
    const input = roomInputSchema.parse(raw);
    const type = await assertAssignableType(propertyId, input.roomTypeId);
    await assertUniqueNumber(propertyId, input.number);
    await assertUniqueName(propertyId, input.name);
    if (input.floorId) {
      const floor = await prisma.floor.findFirst({ where: { id: input.floorId, propertyId } });
      if (!floor) throw new DomainError("Il piano selezionato non esiste.");
    }
    const floorIndex = await resolveFloorIndex(input.floorId);
    const maxSort = await prisma.room.aggregate({ where: { propertyId }, _max: { sortOrder: true } });

    const created = await prisma.room.create({
      data: {
        propertyId,
        roomTypeId: type.id,
        floorId: input.floorId || null,
        number: input.number,
        name: input.name?.trim() || null,
        floor: floorIndex,
        capacity: input.capacity,
        beds: type.beds,
        status: input.status,
        notes: input.notes ?? "",
        customBasePrice: input.customBasePrice ?? null,
        active: input.active ?? true,
        sortOrder: input.sortOrder ?? (maxSort._max.sortOrder ?? 0) + 1,
      },
    });

    await auditService.record({
      propertyId,
      userId,
      action: "ROOM_CREATED",
      entity: "Room",
      entityId: created.id,
      after: roomSnapshot(created),
    });
    return roomRepo.get(created.id);
  },

  async update(roomId: string, raw: Partial<RoomInput>, userId?: string) {
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) throw new DomainError("Camera non trovata.");
    const input = roomInputSchema.partial().parse(raw);
    if (input.number) await assertUniqueNumber(room.propertyId, input.number, roomId);
    if (input.name !== undefined) await assertUniqueName(room.propertyId, input.name, roomId);
    if (input.roomTypeId) await assertAssignableType(room.propertyId, input.roomTypeId);
    if (input.floorId) {
      const floor = await prisma.floor.findFirst({ where: { id: input.floorId, propertyId: room.propertyId } });
      if (!floor) throw new DomainError("Il piano selezionato non esiste.");
    }
    if (input.capacity) await assertCapacityAgainstReservations(roomId, input.capacity);

    const floorIndex =
      input.floorId !== undefined ? await resolveFloorIndex(input.floorId) : room.floor;
    const nextActive = input.active ?? room.active;
    const action =
      room.active && nextActive === false ? "ROOM_DEACTIVATED" : "ROOM_UPDATED";

    const updated = await prisma.room.update({
      where: { id: roomId },
      data: {
        ...(input.number ? { number: input.number } : {}),
        ...(input.name !== undefined ? { name: input.name?.trim() || null } : {}),
        ...(input.roomTypeId ? { roomTypeId: input.roomTypeId } : {}),
        ...(input.floorId !== undefined ? { floorId: input.floorId || null, floor: floorIndex } : {}),
        ...(input.capacity ? { capacity: input.capacity } : {}),
        ...(input.status ? { status: input.status } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
        ...(input.customBasePrice !== undefined ? { customBasePrice: input.customBasePrice } : {}),
        ...(input.active !== undefined ? { active: input.active } : {}),
        ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      },
    });

    await auditService.record({
      propertyId: room.propertyId,
      userId,
      action,
      entity: "Room",
      entityId: roomId,
      before: roomSnapshot(room),
      after: roomSnapshot(updated),
    });
    return roomRepo.get(roomId);
  },

  async changeType(roomId: string, roomTypeId: string, userId?: string) {
    return this.update(roomId, { roomTypeId }, userId);
  },

  async changeFloor(roomId: string, floorId: string | null, userId?: string) {
    return this.update(roomId, { floorId }, userId);
  },

  async setActive(roomId: string, active: boolean, userId?: string) {
    return this.update(roomId, { active }, userId);
  },

  async updateStatus(roomId: string, status: RoomStatus, userId?: string, notes?: string) {
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) throw new DomainError("Camera non trovata.");
    await prisma.$transaction(async (tx) => {
      await tx.room.update({ where: { id: roomId }, data: { status, notes: notes ?? room.notes } });
      await tx.housekeepingTask.create({
        data: {
          propertyId: room.propertyId,
          roomId,
          status,
          notes: notes ?? "",
        },
      });
      await auditService.record({
        tx,
        propertyId: room.propertyId,
        userId,
        action: "room.status",
        entity: "Room",
        entityId: roomId,
        before: { status: room.status },
        after: { status },
      });
    });
    return roomRepo.get(roomId);
  },

  async updateNotes(roomId: string, notes: string, userId?: string) {
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) throw new DomainError("Camera non trovata.");
    const updated = await prisma.room.update({ where: { id: roomId }, data: { notes } });
    await auditService.record({
      propertyId: room.propertyId,
      userId,
      action: "room.notes",
      entity: "Room",
      entityId: roomId,
      before: { notes: room.notes },
      after: { notes },
    });
    return updated;
  },

  async remove(roomId: string, userId?: string) {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: { _count: { select: { reservations: true, housekeepingTasks: true } } },
    });
    if (!room) throw new DomainError("Camera non trovata.");
    if (room._count.reservations > 0) {
      throw new DomainError(
        `Impossibile eliminare la camera ${room.number}: esistono ${room._count.reservations} prenotazioni collegate. Disattivala per toglierla da disponibilità e planning operativo, senza perdere lo storico.`,
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.housekeepingTask.deleteMany({ where: { roomId } });
      await tx.room.delete({ where: { id: roomId } });
      await auditService.record({
        tx,
        propertyId: room.propertyId,
        userId,
        action: "ROOM_UPDATED",
        entity: "Room",
        entityId: roomId,
        before: roomSnapshot(room),
        after: { deleted: true },
      });
    });
    return { id: roomId };
  },
};
