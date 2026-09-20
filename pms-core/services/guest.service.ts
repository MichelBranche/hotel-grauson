import { prisma } from "@pms-core/database/client";
import { guestRepo } from "@pms-core/database/repositories/guest.repo";
import { DomainError } from "@pms-core/lib/errors";
import { auditService } from "@pms-core/services/audit.service";

export type GuestInput = {
  propertyId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  country?: string;
  documentType?: string;
  documentNumber?: string;
  dateOfBirth?: string;
  notes?: string;
  preferences?: string[];
  vip?: boolean;
};

export const guestService = {
  list: guestRepo.list,
  get: guestRepo.get,
  search: guestRepo.search,

  async create(input: GuestInput, userId?: string) {
    const guest = await prisma.guest.create({
      data: {
        propertyId: input.propertyId,
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone,
        country: input.country,
        documentType: input.documentType,
        documentNumber: input.documentNumber,
        dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
        notes: input.notes ?? "",
        preferences: JSON.stringify(input.preferences ?? []),
        vip: input.vip ?? false,
      },
    });
    await auditService.record({
      propertyId: input.propertyId,
      userId,
      action: "guest.create",
      entity: "Guest",
      entityId: guest.id,
      after: { name: `${input.lastName} ${input.firstName}` },
    });
    return guest;
  },

  async update(id: string, input: Partial<GuestInput>, userId?: string) {
    const current = await prisma.guest.findUnique({ where: { id } });
    if (!current) throw new DomainError("Ospite non trovato.");
    const guest = await prisma.guest.update({
      where: { id },
      data: {
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone,
        country: input.country,
        documentType: input.documentType,
        documentNumber: input.documentNumber,
        dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : undefined,
        notes: input.notes,
        preferences: input.preferences ? JSON.stringify(input.preferences) : undefined,
        vip: input.vip,
      },
    });
    await auditService.record({
      propertyId: current.propertyId,
      userId,
      action: "guest.update",
      entity: "Guest",
      entityId: id,
      before: { name: `${current.lastName} ${current.firstName}` },
      after: { name: `${guest.lastName} ${guest.firstName}` },
    });
    return guest;
  },
};
