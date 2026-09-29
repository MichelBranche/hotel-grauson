import { occupyingStatuses } from "@pms-core/config/status";
import { prisma } from "@pms-core/database/client";
import { DomainError } from "@pms-core/lib/errors";
import { addDaysISO, eachISODate, formatShort, toDate, toISODate } from "@pms-core/lib/dates";
import { closureInputSchema, type ClosureInput } from "@pms-core/lib/rates";
import { auditService } from "@pms-core/services/audit.service";

export type TypeClosureRange = {
  roomTypeId: string;
  roomTypeName: string;
  startDate: string;
  endDate: string;
  nights: number;
};

/** Collapse per-night Inventory.closed rows into contiguous ranges per room type. */
function toRanges(rows: { roomTypeId: string; date: Date; roomType: { name: string } }[]): TypeClosureRange[] {
  const ranges: TypeClosureRange[] = [];
  const sorted = [...rows].sort((a, b) =>
    a.roomTypeId === b.roomTypeId ? a.date.getTime() - b.date.getTime() : a.roomTypeId.localeCompare(b.roomTypeId),
  );
  for (const row of sorted) {
    const date = toISODate(row.date);
    const last = ranges.at(-1);
    if (last && last.roomTypeId === row.roomTypeId && addDaysISO(last.endDate, 1) === date) {
      last.endDate = date;
      last.nights += 1;
    } else {
      ranges.push({ roomTypeId: row.roomTypeId, roomTypeName: row.roomType.name, startDate: date, endDate: date, nights: 1 });
    }
  }
  return ranges.sort((a, b) => a.startDate.localeCompare(b.startDate) || a.roomTypeName.localeCompare(b.roomTypeName));
}

async function roomFor(propertyId: string, id: string) {
  const room = await prisma.room.findFirst({ where: { id, propertyId } });
  if (!room) throw new DomainError("Camera non trovata.");
  return room;
}

async function assertRoomFree(roomId: string, roomNumber: string, startDate: string, endDate: string, excludeBlockId?: string) {
  const clash = await prisma.roomBlock.findFirst({
    where: {
      roomId,
      ...(excludeBlockId ? { id: { not: excludeBlockId } } : {}),
      startDate: { lte: toDate(endDate) },
      endDate: { gte: toDate(startDate) },
    },
  });
  if (clash) {
    throw new DomainError(
      `La camera ${roomNumber} è già chiusa dal ${formatShort(toISODate(clash.startDate))} al ${formatShort(toISODate(clash.endDate))}: modifica quella chiusura.`,
    );
  }
  const reservation = await prisma.reservation.findFirst({
    where: {
      roomId,
      status: { in: occupyingStatuses },
      checkIn: { lte: toDate(endDate) },
      checkOut: { gt: toDate(startDate) },
    },
    include: { guest: true },
    orderBy: { checkIn: "asc" },
  });
  if (reservation) {
    throw new DomainError(
      `La camera ${roomNumber} ha la prenotazione ${reservation.code} (${reservation.guest.lastName}) in queste date: spostala prima di chiudere la camera.`,
    );
  }
}

export const closureService = {
  async targets(propertyId: string) {
    const [roomTypes, rooms] = await Promise.all([
      prisma.roomType.findMany({ where: { propertyId, active: true }, orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
      prisma.room.findMany({
        where: { propertyId, active: true },
        orderBy: [{ floor: "asc" }, { sortOrder: "asc" }, { number: "asc" }],
        select: { id: true, number: true, roomType: { select: { name: true } } },
      }),
    ]);
    return {
      roomTypes,
      rooms: rooms.map((room) => ({ id: room.id, number: room.number, roomTypeName: room.roomType.name })),
    };
  },

  async list(propertyId: string, from: string) {
    const [inventory, blocks] = await Promise.all([
      prisma.inventory.findMany({
        where: { propertyId, closed: true, date: { gte: toDate(from) } },
        include: { roomType: { select: { name: true } } },
      }),
      prisma.roomBlock.findMany({
        where: { propertyId, endDate: { gte: toDate(from) } },
        include: { room: { select: { number: true, roomType: { select: { name: true } } } } },
        orderBy: { startDate: "asc" },
      }),
    ]);
    return {
      typeClosures: toRanges(inventory),
      roomBlocks: blocks.map((block) => ({
        id: block.id,
        roomId: block.roomId,
        roomNumber: block.room.number,
        roomTypeName: block.room.roomType.name,
        startDate: toISODate(block.startDate),
        endDate: toISODate(block.endDate),
        reason: block.reason,
      })),
    };
  },

  async create(propertyId: string, raw: ClosureInput, userId?: string) {
    const input = closureInputSchema.parse(raw);
    if (input.scope === "roomType") {
      const type = await prisma.roomType.findFirst({ where: { id: input.targetId, propertyId } });
      if (!type) throw new DomainError("Tipologia non trovata.");
      const dates = eachISODate(input.startDate, addDaysISO(input.endDate, 1));
      await prisma.$transaction(
        dates.map((date) =>
          prisma.inventory.upsert({
            where: { propertyId_roomTypeId_date: { propertyId, roomTypeId: type.id, date: toDate(date) } },
            update: { closed: true },
            create: { propertyId, roomTypeId: type.id, date: toDate(date), closed: true },
          }),
        ),
      );
      await auditService.record({ propertyId, userId, action: "INVENTORY_CLOSED", entity: "RoomType", entityId: type.id, after: input });
      return { scope: "roomType" as const, id: type.id };
    }

    const room = await roomFor(propertyId, input.targetId);
    await assertRoomFree(room.id, room.number, input.startDate, input.endDate);
    const block = await prisma.roomBlock.create({
      data: {
        propertyId,
        roomId: room.id,
        startDate: toDate(input.startDate),
        endDate: toDate(input.endDate),
        reason: input.reason ?? "",
      },
    });
    await auditService.record({ propertyId, userId, action: "ROOM_BLOCK_CREATED", entity: "RoomBlock", entityId: block.id, after: input });
    return { scope: "room" as const, id: block.id };
  },

  /** Reopen a room type for sale. Rows that also carry min/max stay keep them. */
  async reopenRoomType(propertyId: string, roomTypeId: string, startDate: string, endDate: string, userId?: string) {
    if (endDate < startDate) throw new DomainError("La data di fine deve essere uguale o successiva all'inizio.");
    const where = { propertyId, roomTypeId, date: { gte: toDate(startDate), lte: toDate(endDate) } };
    await prisma.$transaction([
      prisma.inventory.deleteMany({ where: { ...where, minStay: null, maxStay: null } }),
      prisma.inventory.updateMany({ where, data: { closed: false } }),
    ]);
    await auditService.record({
      propertyId,
      userId,
      action: "INVENTORY_REOPENED",
      entity: "RoomType",
      entityId: roomTypeId,
      after: { startDate, endDate },
    });
  },

  async updateBlock(propertyId: string, id: string, raw: { startDate: string; endDate: string; reason?: string }, userId?: string) {
    const block = await prisma.roomBlock.findFirst({ where: { id, propertyId }, include: { room: true } });
    if (!block) throw new DomainError("Chiusura non trovata.");
    const input = closureInputSchema.parse({ scope: "room", targetId: block.roomId, ...raw });
    await assertRoomFree(block.roomId, block.room.number, input.startDate, input.endDate, id);
    await prisma.roomBlock.update({
      where: { id },
      data: { startDate: toDate(input.startDate), endDate: toDate(input.endDate), reason: input.reason ?? "" },
    });
    await auditService.record({
      propertyId,
      userId,
      action: "ROOM_BLOCK_UPDATED",
      entity: "RoomBlock",
      entityId: id,
      before: { startDate: toISODate(block.startDate), endDate: toISODate(block.endDate), reason: block.reason },
      after: input,
    });
  },

  async deleteBlock(propertyId: string, id: string, userId?: string) {
    const block = await prisma.roomBlock.findFirst({ where: { id, propertyId } });
    if (!block) throw new DomainError("Chiusura non trovata.");
    await prisma.roomBlock.delete({ where: { id } });
    await auditService.record({
      propertyId,
      userId,
      action: "ROOM_BLOCK_DELETED",
      entity: "RoomBlock",
      entityId: id,
      before: { roomId: block.roomId, startDate: toISODate(block.startDate), endDate: toISODate(block.endDate), reason: block.reason },
    });
  },
};
