import type { HousekeepingPriority, RoomStatus } from "@prisma/client";

import { prisma } from "@pms-core/database/client";
import { roomService } from "@pms-core/services/room.service";

export const housekeepingService = {
  board(propertyId: string) {
    return prisma.room.findMany({
      where: { propertyId },
      include: {
        roomType: true,
        housekeepingTasks: { orderBy: { updatedAt: "desc" }, take: 1, include: { assignee: true } },
      },
      orderBy: [{ floor: "asc" }, { number: "asc" }],
    });
  },

  async setStatus(roomId: string, status: RoomStatus, userId?: string, notes?: string) {
    return roomService.updateStatus(roomId, status, userId, notes);
  },

  async assign(taskId: string, assigneeId: string | null, priority?: HousekeepingPriority) {
    return prisma.housekeepingTask.update({
      where: { id: taskId },
      data: { assigneeId, ...(priority ? { priority } : {}) },
    });
  },
};
