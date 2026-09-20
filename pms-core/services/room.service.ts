import type { RoomStatus } from "@prisma/client";

import { prisma } from "@pms-core/database/client";
import { roomRepo } from "@pms-core/database/repositories/room.repo";
import { DomainError } from "@pms-core/lib/errors";
import { auditService } from "@pms-core/services/audit.service";

export const roomService = {
  list: roomRepo.list,
  get: roomRepo.get,
  types: roomRepo.types,

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
};
