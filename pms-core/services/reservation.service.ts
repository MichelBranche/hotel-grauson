import type { Prisma, ReservationStatus } from "@prisma/client";

import { prisma } from "@pms-core/database/client";
import { reservationRepo } from "@pms-core/database/repositories/reservation.repo";
import { DomainError } from "@pms-core/lib/errors";
import { nightsBetween, toDate, toISODate } from "@pms-core/lib/dates";
import { parseJson } from "@pms-core/lib/utils";
import { roundMoney } from "@pms-core/lib/money";
import { occupyingStatuses } from "@pms-core/config/status";
import { availabilityService } from "@pms-core/services/availability.service";
import { auditService } from "@pms-core/services/audit.service";
import { notificationService } from "@pms-core/services/notification.service";

type Actor = { id?: string | null; name?: string };

export type ReservationDraft = {
  propertyId: string;
  roomId: string;
  guest: {
    id?: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    country?: string;
    notes?: string;
    vip?: boolean;
  };
  checkIn: string;
  checkOut: string;
  adults: number;
  children?: number;
  ratePlanId?: string;
  extras?: { extraId: string; quantity: number }[];
  notes?: string;
  status?: ReservationStatus;
  source?: string;
  channel?: string;
  payment?: { amount: number; method: "CASH" | "CARD" | "BANK_TRANSFER" | "ONLINE" | "OTHER" };
};

async function nextCode(tx: Prisma.TransactionClient, propertyId: string) {
  const property = await tx.property.update({
    where: { id: propertyId },
    data: { reservationSeq: { increment: 1 } },
  });
  const year = new Date().getFullYear();
  const settings = parseJson<{ reservationPrefix?: string }>(property.settings, {});
  const prefix = settings.reservationPrefix ?? "BK";
  return `${prefix}-${year}-${property.reservationSeq}`;
}

async function quoteStay(input: {
  propertyId: string;
  roomTypeId: string;
  ratePlanId?: string;
  checkIn: string;
  checkOut: string;
  extras?: { extraId: string; quantity: number }[];
}) {
  const nights = nightsBetween(input.checkIn, input.checkOut);
  const property = await prisma.property.findUnique({ where: { id: input.propertyId } });
  const taxRate = parseJson<{ taxRate?: number }>(property?.settings ?? "{}", {}).taxRate ?? 0.1;

  const roomType = await prisma.roomType.findUnique({ where: { id: input.roomTypeId } });
  const fallbackNightly = roomType?.basePrice ?? 0;
  let roomRate = fallbackNightly * nights;
  if (input.ratePlanId) {
    const base = await prisma.ratePlanPrice.findUnique({
      where: { ratePlanId_roomTypeId: { ratePlanId: input.ratePlanId, roomTypeId: input.roomTypeId } },
    });
    roomRate = (base?.basePrice ?? fallbackNightly) * nights;
  }

  const extras = [];
  let extrasTotal = 0;
  if (input.extras?.length) {
    const catalog = await prisma.extra.findMany({
      where: { id: { in: input.extras.map((item) => item.extraId) } },
    });
    for (const line of input.extras) {
      const extra = catalog.find((item) => item.id === line.extraId);
      if (!extra) continue;
      const total = extra.price * line.quantity * (extra.perNight ? nights : 1);
      extrasTotal += total;
      extras.push({ extraId: extra.id, quantity: line.quantity, unitPrice: extra.price, total: roundMoney(total) });
    }
  }

  const taxesTotal = roundMoney((roomRate + extrasTotal) * taxRate);
  const total = roundMoney(roomRate + extrasTotal + taxesTotal);
  return { nights, roomRate: roundMoney(roomRate), extrasTotal: roundMoney(extrasTotal), taxesTotal, total, extras };
}

export const reservationService = {
  get(id: string) {
    return reservationRepo.findById(id);
  },

  list(propertyId: string, filters?: { query?: string; status?: ReservationStatus }) {
    return prisma.reservation.findMany({
      where: {
        propertyId,
        ...(filters?.status ? { status: filters.status } : {}),
        ...(filters?.query
          ? {
              OR: [
                { code: { contains: filters.query } },
                { guest: { lastName: { contains: filters.query } } },
                { guest: { firstName: { contains: filters.query } } },
                { room: { number: { contains: filters.query } } },
              ],
            }
          : {}),
      },
      include: { guest: true, room: true, roomType: true, payments: true },
      orderBy: { checkIn: "desc" },
    });
  },

  async create(draft: ReservationDraft, actor: Actor = {}) {
    if (nightsBetween(draft.checkIn, draft.checkOut) < 1) {
      throw new DomainError("La data di check-out deve essere successiva al check-in.");
    }

    const room = await availabilityService.assertRoomAvailable({
      roomId: draft.roomId,
      checkIn: draft.checkIn,
      checkOut: draft.checkOut,
      adults: draft.adults,
      children: draft.children,
    });

    const quote = await quoteStay({
      propertyId: draft.propertyId,
      roomTypeId: room.roomTypeId,
      ratePlanId: draft.ratePlanId,
      checkIn: draft.checkIn,
      checkOut: draft.checkOut,
      extras: draft.extras,
    });

    const reservation = await prisma.$transaction(async (tx) => {
      const guest = draft.guest.id
        ? await tx.guest.update({
            where: { id: draft.guest.id },
            data: {
              firstName: draft.guest.firstName,
              lastName: draft.guest.lastName,
              email: draft.guest.email,
              phone: draft.guest.phone,
              country: draft.guest.country,
              notes: draft.guest.notes,
              vip: draft.guest.vip ?? false,
            },
          })
        : await tx.guest.create({
            data: {
              propertyId: draft.propertyId,
              firstName: draft.guest.firstName,
              lastName: draft.guest.lastName,
              email: draft.guest.email,
              phone: draft.guest.phone,
              country: draft.guest.country,
              notes: draft.guest.notes ?? "",
              vip: draft.guest.vip ?? false,
            },
          });

      const code = await nextCode(tx, draft.propertyId);
      const created = await tx.reservation.create({
        data: {
          propertyId: draft.propertyId,
          code,
          roomId: room.id,
          roomTypeId: room.roomTypeId,
          ratePlanId: draft.ratePlanId,
          guestId: guest.id,
          status: draft.status ?? "CONFIRMED",
          checkIn: toDate(draft.checkIn),
          checkOut: toDate(draft.checkOut),
          adults: draft.adults,
          children: draft.children ?? 0,
          nights: quote.nights,
          roomRate: quote.roomRate,
          extrasTotal: quote.extrasTotal,
          taxesTotal: quote.taxesTotal,
          total: quote.total,
          notes: draft.notes ?? "",
          vip: draft.guest.vip ?? false,
          source: draft.source ?? "pms",
          channel: draft.channel ?? "DIRECT",
          extras: { create: quote.extras },
          guests: { create: { guestId: guest.id, isPrimary: true } },
          payments: draft.payment
            ? {
                create: {
                  amount: draft.payment.amount,
                  method: draft.payment.method,
                  status: "COMPLETED",
                },
              }
            : undefined,
        },
      });

      await auditService.record({
        tx,
        propertyId: draft.propertyId,
        userId: actor.id,
        action: "reservation.create",
        entity: "Reservation",
        entityId: created.id,
        after: { code, roomId: room.id, checkIn: draft.checkIn, checkOut: draft.checkOut },
      });

      return created;
    });

    await notificationService.create({
      propertyId: draft.propertyId,
      type: "reservation.created",
      title: "Nuova prenotazione",
      body: `${draft.guest.lastName} ${draft.guest.firstName} · camera ${room.number} · ${draft.checkIn} → ${draft.checkOut}`,
      entity: "Reservation",
      entityId: reservation.id,
    });

    return reservationRepo.findById(reservation.id);
  },

  async move(
    id: string,
    input: { roomId: string; checkIn: string; checkOut: string; adults?: number; children?: number },
    actor: Actor = {},
  ) {
    const current = await reservationRepo.findById(id);
    if (!current) throw new DomainError("Prenotazione non trovata.");
    if (!occupyingStatuses.includes(current.status) && current.status !== "INQUIRY") {
      throw new DomainError("Questa prenotazione non può essere spostata nello stato attuale.");
    }
    if (nightsBetween(input.checkIn, input.checkOut) < 1) {
      throw new DomainError("La data di check-out deve essere successiva al check-in.");
    }

    const room = await availabilityService.assertRoomAvailable({
      roomId: input.roomId,
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      adults: input.adults ?? current.adults,
      children: input.children ?? current.children,
      excludeReservationId: id,
    });

    const before = {
      roomId: current.roomId,
      roomNumber: current.room.number,
      checkIn: toISODate(current.checkIn),
      checkOut: toISODate(current.checkOut),
    };

    const nights = nightsBetween(input.checkIn, input.checkOut);
    const roomRate = current.nights > 0 ? roundMoney((current.roomRate / current.nights) * nights) : current.roomRate;
    const extrasTotal = current.nights > 0 ? roundMoney((current.extrasTotal / current.nights) * nights) : current.extrasTotal;
    const taxesTotal = current.nights > 0 ? roundMoney((current.taxesTotal / current.nights) * nights) : current.taxesTotal;

    await prisma.$transaction(async (tx) => {
      await tx.reservation.update({
        where: { id },
        data: {
          roomId: room.id,
          roomTypeId: room.roomTypeId,
          checkIn: toDate(input.checkIn),
          checkOut: toDate(input.checkOut),
          nights,
          roomRate,
          extrasTotal,
          taxesTotal,
          total: roundMoney(roomRate + extrasTotal + taxesTotal),
        },
      });
      await auditService.record({
        tx,
        propertyId: current.propertyId,
        userId: actor.id,
        action: "reservation.move",
        entity: "Reservation",
        entityId: id,
        before,
        after: { roomId: room.id, roomNumber: room.number, checkIn: input.checkIn, checkOut: input.checkOut },
      });
    });

    await notificationService.create({
      propertyId: current.propertyId,
      type: "reservation.modified",
      title: "Prenotazione modificata",
      body: `${current.code}: camera ${before.roomNumber} → ${room.number}`,
      entity: "Reservation",
      entityId: id,
    });

    return reservationRepo.findById(id);
  },

  async updateStatus(id: string, status: ReservationStatus, actor: Actor = {}) {
    const current = await reservationRepo.findById(id);
    if (!current) throw new DomainError("Prenotazione non trovata.");

    await prisma.$transaction(async (tx) => {
      await tx.reservation.update({ where: { id }, data: { status } });
      if (status === "CHECKED_IN") {
        await tx.room.update({ where: { id: current.roomId }, data: { status: "OCCUPIED" } });
      }
      if (status === "CHECKED_OUT") {
        await tx.room.update({ where: { id: current.roomId }, data: { status: "DIRTY" } });
        await tx.housekeepingTask.create({
          data: {
            propertyId: current.propertyId,
            roomId: current.roomId,
            status: "DIRTY",
            priority: "HIGH",
            notes: `Check-out ${current.code}`,
          },
        });
      }
      await auditService.record({
        tx,
        propertyId: current.propertyId,
        userId: actor.id,
        action: `reservation.${status.toLowerCase()}`,
        entity: "Reservation",
        entityId: id,
        before: { status: current.status },
        after: { status },
      });
    });

    if (status === "CANCELLED") {
      await notificationService.create({
        propertyId: current.propertyId,
        type: "reservation.cancelled",
        title: "Prenotazione cancellata",
        body: `${current.code} · ${current.guest.lastName} ${current.guest.firstName}`,
        entity: "Reservation",
        entityId: id,
      });
    }

    return reservationRepo.findById(id);
  },

  async updateNotes(id: string, notes: string, actor: Actor = {}) {
    const current = await reservationRepo.findById(id);
    if (!current) throw new DomainError("Prenotazione non trovata.");
    await prisma.reservation.update({ where: { id }, data: { notes } });
    await auditService.record({
      propertyId: current.propertyId,
      userId: actor.id,
      action: "reservation.notes",
      entity: "Reservation",
      entityId: id,
      before: { notes: current.notes },
      after: { notes },
    });
    return reservationRepo.findById(id);
  },

  async addExtra(id: string, extraId: string, quantity: number, actor: Actor = {}) {
    const current = await reservationRepo.findById(id);
    if (!current) throw new DomainError("Prenotazione non trovata.");
    const extra = await prisma.extra.findUnique({ where: { id: extraId } });
    if (!extra) throw new DomainError("Extra non trovato.");
    const total = extra.price * quantity * (extra.perNight ? current.nights : 1);
    await prisma.$transaction(async (tx) => {
      await tx.reservationExtra.create({
        data: { reservationId: id, extraId, quantity, unitPrice: extra.price, total: roundMoney(total) },
      });
      await tx.reservation.update({
        where: { id },
        data: {
          extrasTotal: { increment: total },
          total: { increment: total },
        },
      });
      await auditService.record({
        tx,
        propertyId: current.propertyId,
        userId: actor.id,
        action: "reservation.extra",
        entity: "Reservation",
        entityId: id,
        after: { extra: extra.name, quantity, total },
      });
    });
    return reservationRepo.findById(id);
  },

  async addPayment(
    id: string,
    input: { amount: number; method: "CASH" | "CARD" | "BANK_TRANSFER" | "ONLINE" | "OTHER"; note?: string },
    actor: Actor = {},
  ) {
    const current = await reservationRepo.findById(id);
    if (!current) throw new DomainError("Prenotazione non trovata.");
    if (input.amount <= 0) throw new DomainError("L'importo del pagamento deve essere maggiore di zero.");
    const payment = await prisma.payment.create({
      data: {
        reservationId: id,
        amount: input.amount,
        method: input.method,
        status: "COMPLETED",
        note: input.note ?? "",
      },
    });
    await auditService.record({
      propertyId: current.propertyId,
      userId: actor.id,
      action: "payment.create",
      entity: "Payment",
      entityId: payment.id,
      after: input,
    });
    await notificationService.create({
      propertyId: current.propertyId,
      type: "payment.received",
      title: "Pagamento ricevuto",
      body: `${current.code} · ${input.amount.toFixed(2)} €`,
      entity: "Reservation",
      entityId: id,
    });
    return reservationRepo.findById(id);
  },
};
