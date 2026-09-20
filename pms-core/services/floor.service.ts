import { prisma } from "@pms-core/database/client";
import { roomRepo } from "@pms-core/database/repositories/room.repo";
import { DomainError } from "@pms-core/lib/errors";
import { floorInputSchema, type FloorInput } from "@pms-core/lib/structure";
import { auditService } from "@pms-core/services/audit.service";

function floorSnapshot(floor: {
  name: string;
  displayName: string;
  sortOrder: number;
  description: string;
  active: boolean;
}) {
  return {
    name: floor.name,
    displayName: floor.displayName,
    sortOrder: floor.sortOrder,
    description: floor.description,
    active: floor.active,
  };
}

async function assertUniqueName(propertyId: string, name: string, excludeId?: string) {
  const existing = await prisma.floor.findFirst({
    where: { propertyId, name, ...(excludeId ? { id: { not: excludeId } } : {}) },
  });
  if (existing) {
    throw new DomainError(`Esiste già un piano con nome «${name}».`);
  }
}

async function syncRoomFloorIndex(floorId: string, sortOrder: number) {
  await prisma.room.updateMany({ where: { floorId }, data: { floor: sortOrder } });
}

export const floorService = {
  list: roomRepo.floors,

  get(id: string) {
    return prisma.floor.findUnique({
      where: { id },
      include: { rooms: { include: { roomType: true }, orderBy: { number: "asc" } } },
    });
  },

  async create(propertyId: string, raw: FloorInput, userId?: string) {
    const input = floorInputSchema.parse(raw);
    await assertUniqueName(propertyId, input.name);
    const created = await prisma.floor.create({
      data: {
        propertyId,
        name: input.name,
        displayName: input.displayName,
        sortOrder: input.sortOrder,
        description: input.description ?? "",
        active: input.active ?? true,
      },
    });
    await auditService.record({
      propertyId,
      userId,
      action: "FLOOR_CREATED",
      entity: "Floor",
      entityId: created.id,
      after: floorSnapshot(created),
    });
    return created;
  },

  async update(id: string, raw: Partial<FloorInput>, userId?: string) {
    const floor = await prisma.floor.findUnique({ where: { id } });
    if (!floor) throw new DomainError("Piano non trovato.");
    const input = floorInputSchema.partial().parse(raw);
    if (input.name) await assertUniqueName(floor.propertyId, input.name, id);
    const nextActive = input.active ?? floor.active;
    const action = floor.active && nextActive === false ? "FLOOR_DEACTIVATED" : "FLOOR_UPDATED";

    const updated = await prisma.floor.update({
      where: { id },
      data: {
        ...(input.name ? { name: input.name } : {}),
        ...(input.displayName ? { displayName: input.displayName } : {}),
        ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.active !== undefined ? { active: input.active } : {}),
      },
    });
    if (input.sortOrder !== undefined && input.sortOrder !== floor.sortOrder) {
      await syncRoomFloorIndex(id, updated.sortOrder);
    }
    await auditService.record({
      propertyId: floor.propertyId,
      userId,
      action,
      entity: "Floor",
      entityId: id,
      before: floorSnapshot(floor),
      after: floorSnapshot(updated),
    });
    return updated;
  },

  async setActive(id: string, active: boolean, userId?: string) {
    return this.update(id, { active }, userId);
  },

  async remove(id: string, userId?: string) {
    const floor = await prisma.floor.findUnique({
      where: { id },
      include: { _count: { select: { rooms: true } } },
    });
    if (!floor) throw new DomainError("Piano non trovato.");
    if (floor._count.rooms > 0) {
      throw new DomainError(
        `Impossibile eliminare «${floor.displayName}»: ${floor._count.rooms} camere sono assegnate a questo piano. Sposta le camere oppure disattiva il piano.`,
      );
    }
    await prisma.floor.delete({ where: { id } });
    await auditService.record({
      propertyId: floor.propertyId,
      userId,
      action: "FLOOR_UPDATED",
      entity: "Floor",
      entityId: id,
      before: floorSnapshot(floor),
      after: { deleted: true },
    });
    return { id };
  },
};
