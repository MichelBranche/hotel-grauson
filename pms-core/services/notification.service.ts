import { prisma } from "@pms-core/database/client";
import { publishRealtime } from "@pms-core/realtime/publish";

type NotifyInput = {
  propertyId: string;
  type: string;
  title: string;
  body: string;
  entity?: string;
  entityId?: string;
};

export const notificationService = {
  async create(input: NotifyInput) {
    const row = await prisma.notification.create({ data: input });
    publishRealtime({
      propertyId: input.propertyId,
      topic: "notification",
      action: "created",
      entityId: input.entityId,
      notificationType: input.type,
      title: input.title,
    });
    return row;
  },

  list(propertyId: string, unreadOnly = false) {
    return prisma.notification.findMany({
      where: { propertyId, ...(unreadOnly ? { read: false } : {}) },
      orderBy: { createdAt: "desc" },
      take: 40,
    });
  },

  unreadCount(propertyId: string) {
    return prisma.notification.count({ where: { propertyId, read: false } });
  },

  async markRead(id: string, propertyId: string) {
    return prisma.notification.updateMany({
      where: { id, propertyId },
      data: { read: true },
    });
  },

  async markAllRead(propertyId: string) {
    return prisma.notification.updateMany({
      where: { propertyId, read: false },
      data: { read: true },
    });
  },
};
