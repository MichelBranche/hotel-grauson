import type { Prisma, ReservationStatus, RoomStatus, UserRole } from "@prisma/client";

import { after } from "next/server";

import { prisma } from "@pms-core/database/client";
import { reservationRepo } from "@pms-core/database/repositories/reservation.repo";
import { canForceCancel } from "@pms-core/config/permissions";
import { propertyConfig } from "@pms-core/config/property";
import { documentAuditAfter } from "@pms-core/lib/check-in-audit";
import {
  checkInGuestComplete,
  companionGuestComplete,
  documentLast4,
  knownDocumentType,
  parseCheckInParty,
  stayParty,
  type CheckInGuestFields,
  type StayGuestSummary,
} from "@pms-core/lib/check-in-guest";
import { ForbiddenError, DomainError } from "@pms-core/lib/errors";
import { formatShort, nightsBetween, toDate, toISODate, todayInTimeZone } from "@pms-core/lib/dates";
import { PAY_AT_PROPERTY_NOTE } from "@pms-core/lib/pay-at-property";
import { parseJson, guestDisplay } from "@pms-core/lib/utils";
import { formatMoneyExact } from "@pms-core/lib/money";
import { repriceStay, type ExtraToPrice } from "@pms-core/lib/reservation-quote";
import {
  appendReservationNote,
  assertCancellationReason,
  assertStatusTransition,
  canModifyStay,
  checkInBlockMessage,
  earlyCheckout,
} from "@pms-core/lib/reservation-status";
import { availabilityService } from "@pms-core/services/availability.service";
import { auditService } from "@pms-core/services/audit.service";
import { pricingService } from "@pms-core/services/pricing.service";
import { notificationService } from "@pms-core/services/notification.service";
import { publishRealtime } from "@pms-core/realtime/publish";

type Actor = { id?: string | null; name?: string; role?: UserRole };

export type ReservationChange = {
  roomId: string;
  checkIn: string;
  checkOut: string;
  adults?: number;
  children?: number;
  ratePlanId?: string | null;
  guest?: { firstName: string; lastName: string; email?: string; phone?: string };
};

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

function defer(task: () => Promise<unknown>) {
  try {
    after(() => task().catch((error) => console.error("Deferred PMS notification failed.", error)));
  } catch {
    void task().catch((error) => console.error("Deferred PMS notification failed.", error));
  }
}

async function loadTaxRate(propertyId: string) {
  const property = await prisma.property.findUnique({ where: { id: propertyId }, select: { settings: true, timezone: true } });
  return {
    taxRate: parseJson<{ taxRate?: number }>(property?.settings ?? "{}", {}).taxRate ?? propertyConfig.settings.taxRate,
    timezone: property?.timezone || propertyConfig.timezone,
  };
}

async function quoteStay(input: {
  propertyId: string;
  roomTypeId: string;
  ratePlanId?: string;
  checkIn: string;
  checkOut: string;
  extras?: ({ extraId: string; quantity: number } & Partial<Pick<ExtraToPrice, "id" | "unitPrice" | "perNight">>)[];
}) {
  const stay = await pricingService.quoteStay({
    propertyId: input.propertyId,
    roomTypeId: input.roomTypeId,
    ratePlanId: input.ratePlanId || undefined,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
  });

  const lines: ExtraToPrice[] = [];
  if (input.extras?.length) {
    const needsCatalog = input.extras.some((line) => line.unitPrice === undefined || line.perNight === undefined);
    const catalog = needsCatalog
      ? await prisma.extra.findMany({ where: { id: { in: input.extras.map((item) => item.extraId) } } })
      : [];
    for (const line of input.extras) {
      const extra = catalog.find((item) => item.id === line.extraId);
      const unitPrice = line.unitPrice ?? extra?.price;
      const perNight = line.perNight ?? extra?.perNight;
      if (unitPrice === undefined || perNight === undefined) continue;
      lines.push({ id: line.id, extraId: line.extraId, quantity: line.quantity, unitPrice, perNight });
    }
  }

  const priced = repriceStay(stay.total, stay.nights.length, lines, stay.taxRate);
  return { ...priced, ratePlanId: stay.plan.id };
}

function moneyOf(value: { nights: number; roomRate: number; extrasTotal: number; taxesTotal: number; total: number }) {
  return {
    nights: value.nights,
    roomRate: value.roomRate,
    extrasTotal: value.extrasTotal,
    taxesTotal: value.taxesTotal,
    total: value.total,
  };
}

function summarize(reservation: NonNullable<Awaited<ReturnType<typeof reservationRepo.findById>>>) {
  return {
    id: reservation.id,
    code: reservation.code,
    status: reservation.status,
    roomId: reservation.roomId,
    roomNumber: reservation.room.number,
    roomTypeName: reservation.roomType.name,
    checkIn: toISODate(reservation.checkIn),
    checkOut: toISODate(reservation.checkOut),
    nights: reservation.nights,
    adults: reservation.adults,
    children: reservation.children,
    ratePlanId: reservation.ratePlanId,
    total: reservation.total,
    roomRate: reservation.roomRate,
    extrasTotal: reservation.extrasTotal,
    taxesTotal: reservation.taxesTotal,
    guestName: guestDisplay(reservation.guest.firstName, reservation.guest.lastName),
    guestFirstName: reservation.guest.firstName,
    guestLastName: reservation.guest.lastName,
    email: reservation.guest.email,
    phone: reservation.guest.phone,
    notes: reservation.notes,
  };
}

async function prepareChange(id: string, input: ReservationChange) {
  const current = await reservationRepo.findById(id);
  if (!current) throw new DomainError("Prenotazione non trovata.");
  if (!canModifyStay(current.status)) {
    throw new DomainError("Questa prenotazione non può essere modificata nello stato attuale.");
  }
  if (nightsBetween(input.checkIn, input.checkOut) < 1) {
    throw new DomainError("La data di check-out deve essere successiva al check-in.");
  }
  if (input.guest && (!input.guest.firstName.trim() || !input.guest.lastName.trim())) {
    throw new DomainError("Nome e cognome dell'ospite sono obbligatori.");
  }
  const adults = input.adults ?? current.adults;
  const children = input.children ?? current.children;
  if (adults < 1) throw new DomainError("Serve almeno un adulto.");
  const room = await availabilityService.assertRoomAvailable({
    roomId: input.roomId,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    adults,
    children,
    excludeReservationId: id,
  });
  const priced = await quoteStay({
    propertyId: current.propertyId,
    roomTypeId: room.roomTypeId,
    ratePlanId: input.ratePlanId === undefined ? (current.ratePlanId ?? undefined) : input.ratePlanId || undefined,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    extras: current.extras.map((line) => ({
      id: line.id,
      extraId: line.extraId,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      perNight: line.extra.perNight,
    })),
  });
  return { current, room, priced, adults, children };
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

  countWebRequests(propertyId: string) {
    return prisma.reservation.count({
      where: {
        propertyId,
        status: "OPTION",
        source: "website",
        notes: { contains: PAY_AT_PROPERTY_NOTE },
      },
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
          ratePlanId: quote.ratePlanId,
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
          extras: {
            create: quote.extras.map(({ extraId, quantity, unitPrice, total }) => ({ extraId, quantity, unitPrice, total })),
          },
          guests: { create: { guestId: guest.id, isPrimary: true, role: "LEADER" } },
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

      return { created, guest, code };
    });

    defer(() =>
      notificationService.create({
        propertyId: draft.propertyId,
        type: "reservation.created",
        title: "Nuova prenotazione",
        body: `${draft.guest.lastName} ${draft.guest.firstName} · camera ${room.number} · ${draft.checkIn} → ${draft.checkOut}`,
        entity: "Reservation",
        entityId: reservation.created.id,
      }),
    );
    publishRealtime({
      propertyId: draft.propertyId,
      topic: "reservation",
      action: "created",
      entityId: reservation.created.id,
    });

    return {
      id: reservation.created.id,
      code: reservation.code,
      status: reservation.created.status,
      roomId: room.id,
      roomNumber: room.number,
      roomTypeName: room.roomType.name,
      guestId: reservation.guest.id,
      guestName: guestDisplay(reservation.guest.firstName, reservation.guest.lastName),
      guestFirstName: reservation.guest.firstName,
      guestLastName: reservation.guest.lastName,
      ratePlanId: quote.ratePlanId,
      email: reservation.guest.email,
      phone: reservation.guest.phone,
      country: reservation.guest.country,
      party: stayParty(reservation.guest, []),
      adults: draft.adults,
      children: draft.children ?? 0,
      checkIn: draft.checkIn,
      checkOut: draft.checkOut,
      nights: quote.nights,
      total: quote.total,
      currency: "EUR" as const,
      notes: draft.notes ?? "",
      vip: draft.guest.vip ?? false,
    };
  },

  async previewChange(id: string, input: ReservationChange) {
    const prepared = await prepareChange(id, input);
    return {
      before: moneyOf(prepared.current),
      after: moneyOf(prepared.priced),
    };
  },

  async move(id: string, input: ReservationChange, actor: Actor = {}) {
    const { current, room, priced, adults, children } = await prepareChange(id, input);
    const unchanged =
      input.roomId === current.roomId &&
      input.checkIn === toISODate(current.checkIn) &&
      input.checkOut === toISODate(current.checkOut) &&
      adults === current.adults &&
      children === current.children &&
      priced.ratePlanId === current.ratePlanId &&
      !input.guest;
    if (unchanged) return { ...summarize(current), previousTotal: current.total };

    const before = {
      roomId: current.roomId,
      roomNumber: current.room.number,
      checkIn: toISODate(current.checkIn),
      checkOut: toISODate(current.checkOut),
      total: current.total,
      nights: current.nights,
    };

    await prisma.$transaction(async (tx) => {
      if (input.guest) {
        await tx.guest.update({
          where: { id: current.guestId },
          data: {
            firstName: input.guest.firstName.trim(),
            lastName: input.guest.lastName.trim(),
            email: input.guest.email?.trim() || null,
            phone: input.guest.phone?.trim() || null,
          },
        });
      }
      await tx.reservation.update({
        where: { id },
        data: {
          roomId: room.id,
          roomTypeId: room.roomTypeId,
          ratePlanId: priced.ratePlanId,
          checkIn: toDate(input.checkIn),
          checkOut: toDate(input.checkOut),
          adults,
          children,
          nights: priced.nights,
          roomRate: priced.roomRate,
          extrasTotal: priced.extrasTotal,
          taxesTotal: priced.taxesTotal,
          total: priced.total,
        },
      });
      for (const line of priced.extras) {
        if (!line.id) continue;
        await tx.reservationExtra.update({ where: { id: line.id }, data: { total: line.total } });
      }
      await auditService.record({
        tx,
        propertyId: current.propertyId,
        userId: actor.id,
        action: "reservation.move",
        entity: "Reservation",
        entityId: id,
        before,
        after: {
          roomId: room.id,
          roomNumber: room.number,
          checkIn: input.checkIn,
          checkOut: input.checkOut,
          nights: priced.nights,
          total: priced.total,
        },
      });
    });

    defer(() =>
      notificationService.create({
        propertyId: current.propertyId,
        type: "reservation.modified",
        title: "Prenotazione modificata",
        body: `${current.code}: ${formatMoneyExact(before.total)} → ${formatMoneyExact(priced.total)} · camera ${room.number}`,
        entity: "Reservation",
        entityId: id,
      }),
    );
    publishRealtime({ propertyId: current.propertyId, topic: "reservation", action: "updated", entityId: id });

    const guestFirstName = input.guest?.firstName.trim() || current.guest.firstName;
    const guestLastName = input.guest?.lastName.trim() || current.guest.lastName;
    return {
      ...summarize(current),
      roomId: room.id,
      roomNumber: room.number,
      roomTypeName: room.roomType.name,
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      nights: priced.nights,
      adults,
      children,
      ratePlanId: priced.ratePlanId,
      total: priced.total,
      roomRate: priced.roomRate,
      extrasTotal: priced.extrasTotal,
      taxesTotal: priced.taxesTotal,
      guestName: guestDisplay(guestFirstName, guestLastName),
      guestFirstName,
      guestLastName,
      email: input.guest ? input.guest.email?.trim() || null : current.guest.email,
      phone: input.guest ? input.guest.phone?.trim() || null : current.guest.phone,
      previousTotal: before.total,
    };
  },

  async checkInDesk(id: string, propertyId: string) {
    const current = await prisma.reservation.findFirst({
      where: { id, propertyId },
      select: {
        id: true,
        code: true,
        adults: true,
        children: true,
        nights: true,
        checkIn: true,
        checkOut: true,
        guestId: true,
        guest: true,
        guests: { include: { guest: true } },
        room: { select: { number: true, status: true, roomType: { select: { name: true } } } },
      },
    });
    if (!current) throw new DomainError("Prenotazione non trovata.");
    const companions = current.guests.filter((link) => link.guestId !== current.guestId);
    return {
      code: current.code,
      checkIn: toISODate(current.checkIn),
      checkOut: toISODate(current.checkOut),
      nights: current.nights,
      adults: current.adults,
      children: current.children,
      roomNumber: current.room.number,
      roomTypeName: current.room.roomType.name,
      blocked: checkInBlockMessage(current.room),
      primary: toDeskGuest(current.guest),
      companions: companions.map((link) => toDeskGuest(link.guest)),
    };
  },

  async revealGuestDocument(guestId: string, propertyId: string) {
    const guest = await prisma.guest.findFirst({
      where: { id: guestId, propertyId },
      select: { documentNumber: true },
    });
    if (!guest) throw new DomainError("Ospite non trovato.");
    return { documentNumber: guest.documentNumber };
  },

  /**
   * Saves check-in guests on the existing Guest rows, then marks the stay in house.
   * Document numbers stay on Guest for reception. Audit stores type and a short reference only.
   * Alloggiati / Questura export is out of scope.
   */
  async checkIn(id: string, input: { primary: CheckInGuestFields; companions: CheckInGuestFields[] }, actor: Actor = {}, propertyId?: string) {
    const current = await prisma.reservation.findFirst({
      where: { id, ...(propertyId ? { propertyId } : {}) },
      select: {
        id: true,
        status: true,
        guestId: true,
        propertyId: true,
        adults: true,
        children: true,
        room: { select: { number: true, status: true } },
        guests: { select: { id: true, guestId: true } },
      },
    });
    if (!current) throw new DomainError("Prenotazione non trovata.");
    assertStatusTransition(current.status, "CHECKED_IN");
    const blocked = checkInBlockMessage(current.room);
    if (blocked) throw new DomainError(blocked);
    const parsed = parseCheckInParty({
      primary: input.primary,
      companions: input.companions,
      partySize: current.adults + current.children,
    });
    const linked = new Set(current.guests.map((link) => link.guestId));
    for (const companion of parsed.companions) {
      if (companion.id && (companion.id === current.guestId || !linked.has(companion.id))) {
        throw new DomainError("Uno degli ospiti non appartiene a questa prenotazione.");
      }
    }

    let party: StayGuestSummary[] = [];
    await prisma.$transaction(async (tx) => {
      const next: StayGuestSummary[] = [];
      await tx.guest.update({ where: { id: current.guestId }, data: guestDocumentData(parsed.primary) });
      const leader = await tx.reservationGuest.updateMany({
        where: { reservationId: current.id, guestId: current.guestId },
        data: { role: "LEADER", isPrimary: true },
      });
      if (leader.count === 0) {
        await tx.reservationGuest.create({
          data: { reservationId: current.id, guestId: current.guestId, isPrimary: true, role: "LEADER" },
        });
      }
      await auditGuestDocument(tx, current.propertyId, actor.id, current.guestId, parsed.primary.documentType, parsed.primary.documentNumber);
      next.push(summaryOf(current.guestId, parsed.primary, true));
      const keep = new Set<string>();
      for (const companion of parsed.companions) {
        if (companion.id) {
          keep.add(companion.id);
          await tx.guest.update({ where: { id: companion.id }, data: guestDocumentData(companion) });
          await tx.reservationGuest.updateMany({
            where: { reservationId: current.id, guestId: companion.id },
            data: { role: "GUEST", isPrimary: false },
          });
          await auditGuestDocument(tx, current.propertyId, actor.id, companion.id, companion.documentType, companion.documentNumber);
          next.push(summaryOf(companion.id, companion, false));
          continue;
        }
        const created = await tx.guest.create({
          data: { propertyId: current.propertyId, ...guestDocumentData(companion), notes: "" },
        });
        await tx.reservationGuest.create({
          data: { reservationId: current.id, guestId: created.id, isPrimary: false, role: "GUEST" },
        });
        await auditGuestDocument(tx, current.propertyId, actor.id, created.id, companion.documentType, companion.documentNumber);
        next.push(summaryOf(created.id, companion, false));
      }
      const removed = current.guests.filter((link) => link.guestId !== current.guestId && !keep.has(link.guestId));
      if (removed.length) {
        await tx.reservationGuest.deleteMany({ where: { id: { in: removed.map((link) => link.id) } } });
      }
      party = next;
    });

    const result = await this.updateStatus(id, "CHECKED_IN", actor);
    return {
      ...result,
      guest: {
        firstName: parsed.primary.firstName,
        lastName: parsed.primary.lastName,
        email: parsed.primary.email,
        phone: parsed.primary.phone,
        country: parsed.primary.citizenship,
        documentType: parsed.primary.documentType,
        documentLast4: documentLast4(parsed.primary.documentNumber),
      },
      party,
    };
  },

  async updateStatus(id: string, status: ReservationStatus, actor: Actor = {}, options?: { reason?: string; force?: boolean }) {
    const current = await prisma.reservation.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        notes: true,
        propertyId: true,
        roomId: true,
        code: true,
        total: true,
        nights: true,
        checkIn: true,
        checkOut: true,
        guest: { select: checkInGuestSelect },
        guests: {
          select: {
            isPrimary: true,
            guest: { select: checkInGuestSelect },
          },
        },
        room: { select: { number: true, status: true } },
        property: { select: { timezone: true } },
      },
    });
    if (!current) throw new DomainError("Prenotazione non trovata.");

    const forceCancel = status === "CANCELLED" && Boolean(options?.force);
    if (forceCancel && (!actor.role || !canForceCancel(actor.role))) {
      throw new ForbiddenError("Solo il titolare o un amministratore può annullare un soggiorno già in check-in.");
    }
    assertStatusTransition(current.status, status, { forceCancel, reason: options?.reason });

    let reason: string | undefined;
    if (status === "CANCELLED") reason = assertCancellationReason(options?.reason);
    else if (options?.reason?.trim()) reason = options.reason.trim();

    if (status === "CHECKED_IN") {
      const blocked = checkInBlockMessage(current.room);
      if (blocked) throw new DomainError(blocked);
      if (!checkInGuestComplete(current.guest)) {
        throw new DomainError("Completa i dati dell'ospite principale prima del check-in.");
      }
      const companions = current.guests.filter((link) => !link.isPrimary && link.guest.id !== current.guest.id);
      if (companions.some((link) => !companionGuestComplete(link.guest))) {
        throw new DomainError("Completa i dati degli altri ospiti prima del check-in.");
      }
    }

    const today = todayInTimeZone(current.property.timezone || propertyConfig.timezone);
    const checkIn = toISODate(current.checkIn);
    const departure = status === "CHECKED_OUT" ? earlyCheckout(checkIn, toISODate(current.checkOut), today) : null;
    const wasInHouse = current.status === "CHECKED_IN";
    let notes = current.notes;
    if (status === "CANCELLED" && reason) notes = appendReservationNote(notes, `Cancellazione ${formatShort(today)}: ${reason}`);
    if (status === "NO_SHOW") notes = appendReservationNote(notes, `No-show ${formatShort(today)}${reason ? `: ${reason}` : ""}`);

    const housekeepingCreated = status === "CHECKED_OUT" || (status === "CANCELLED" && wasInHouse);

    await prisma.$transaction(async (tx) => {
      await tx.reservation.update({
        where: { id },
        data: {
          status,
          notes,
          ...(departure?.shortened ? { checkOut: toDate(departure.checkOut), nights: departure.nights } : {}),
        },
      });
      if (status === "CHECKED_IN") {
        await tx.room.update({ where: { id: current.roomId }, data: { status: "OCCUPIED" } });
      }
      if (housekeepingCreated) {
        await tx.room.update({ where: { id: current.roomId }, data: { status: "DIRTY" } });
        await tx.housekeepingTask.create({
          data: {
            propertyId: current.propertyId,
            roomId: current.roomId,
            status: "DIRTY",
            priority: "HIGH",
            notes: status === "CHECKED_OUT" ? `Check-out ${current.code}` : `Annullamento in casa ${current.code}`,
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
        before: { status: current.status, checkOut: toISODate(current.checkOut), total: current.total },
        after: {
          status,
          ...(reason ? { reason } : {}),
          ...(departure ? { checkOut: departure.checkOut, nights: departure.nights, shortened: departure.shortened, total: current.total } : {}),
          ...(forceCancel ? { forced: true } : {}),
        },
      });
    });

    if (status === "CANCELLED" || status === "NO_SHOW") {
      defer(() =>
        notificationService.create({
          propertyId: current.propertyId,
          type: status === "CANCELLED" ? "reservation.cancelled" : "reservation.no_show",
          title: status === "CANCELLED" ? "Prenotazione cancellata" : "No-show",
          body: `${current.code} · ${current.guest.lastName} ${current.guest.firstName}`,
          entity: "Reservation",
          entityId: id,
        }),
      );
    }
    publishRealtime({
      propertyId: current.propertyId,
      topic: "reservation",
      action: status.toLowerCase(),
      entityId: id,
    });

    const message =
      status === "CHECKED_IN"
        ? `Check-in registrato. La camera ${current.room.number} è occupata.`
        : status === "CHECKED_OUT"
          ? departure?.shortened
            ? `Check-out anticipato. Il totale resta ${formatMoneyExact(current.total)} e le notti dal ${formatShort(departure.checkOut)} sono di nuovo in vendita. La camera è da pulire.`
            : `Check-out registrato. La camera ${current.room.number} è da pulire.`
          : status === "CANCELLED"
            ? wasInHouse
              ? "Soggiorno annullato. La camera è da pulire."
              : "Prenotazione cancellata. La camera è di nuovo in vendita."
            : status === "NO_SHOW"
              ? "No-show registrato. La camera è di nuovo in vendita."
              : status === "CONFIRMED"
                ? "Prenotazione confermata."
                : status === "OPTION"
                  ? "Prenotazione messa in opzione."
                  : "Stato aggiornato.";

    const roomStatus: RoomStatus =
      status === "CHECKED_IN" ? "OCCUPIED" : housekeepingCreated ? "DIRTY" : current.room.status;

    return {
      id,
      status,
      housekeepingCreated,
      message,
      total: current.total,
      roomId: current.roomId,
      roomStatus,
      checkOut: departure?.shortened ? departure.checkOut : toISODate(current.checkOut),
      nights: departure?.shortened ? departure.nights : current.nights,
    };
  },

  async updateNotes(id: string, notes: string, actor: Actor = {}) {
    const current = await prisma.reservation.findUnique({
      where: { id },
      select: { id: true, propertyId: true, notes: true },
    });
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
    publishRealtime({ propertyId: current.propertyId, topic: "reservation", action: "updated", entityId: id });
    return { id };
  },

  async addExtra(id: string, extraId: string, quantity: number, actor: Actor = {}) {
    const current = await reservationRepo.findById(id);
    if (!current) throw new DomainError("Prenotazione non trovata.");
    if (!canModifyStay(current.status)) {
      throw new DomainError("Non si possono aggiungere extra a una prenotazione chiusa.");
    }
    const extra = await prisma.extra.findUnique({ where: { id: extraId } });
    if (!extra) throw new DomainError("Extra non trovato.");
    if (quantity < 1) throw new DomainError("La quantità dell'extra deve essere almeno 1.");
    const { taxRate } = await loadTaxRate(current.propertyId);
    const priced = repriceStay(current.roomRate, current.nights, [
      ...current.extras.map((line) => ({
        id: line.id,
        extraId: line.extraId,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        perNight: line.extra.perNight,
      })),
      { extraId, quantity, unitPrice: extra.price, perNight: extra.perNight },
    ], taxRate);
    const added = priced.extras[priced.extras.length - 1];
    await prisma.$transaction(async (tx) => {
      await tx.reservationExtra.create({
        data: { reservationId: id, extraId, quantity, unitPrice: extra.price, total: added.total },
      });
      await tx.reservation.update({
        where: { id },
        data: {
          extrasTotal: priced.extrasTotal,
          taxesTotal: priced.taxesTotal,
          total: priced.total,
        },
      });
      await auditService.record({
        tx,
        propertyId: current.propertyId,
        userId: actor.id,
        action: "reservation.extra",
        entity: "Reservation",
        entityId: id,
        after: { extra: extra.name, quantity, total: added.total, reservationTotal: priced.total },
      });
    });
    publishRealtime({ propertyId: current.propertyId, topic: "reservation", action: "updated", entityId: id });
    return { id };
  },

  async addPayment(
    id: string,
    input: { amount: number; method: "CASH" | "CARD" | "BANK_TRANSFER" | "ONLINE" | "OTHER"; note?: string },
    actor: Actor = {},
  ) {
    const current = await prisma.reservation.findUnique({
      where: { id },
      select: { id: true, propertyId: true, code: true },
    });
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
    publishRealtime({ propertyId: current.propertyId, topic: "reservation", action: "payment", entityId: id });
    return { id };
  },
};

const checkInGuestSelect = {
  id: true,
  firstName: true,
  lastName: true,
  sex: true,
  dateOfBirth: true,
  birthPlace: true,
  citizenship: true,
  residenceAddress: true,
  residencePostalCode: true,
  residenceCity: true,
  residenceProvince: true,
  residenceCountry: true,
  documentType: true,
  documentNumber: true,
  documentAuthority: true,
  documentIssuedOn: true,
  documentExpiresOn: true,
  documentCountry: true,
} as const;

function toDeskGuest(guest: {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  country: string | null;
  citizenship: string | null;
  sex: string | null;
  dateOfBirth: Date | null;
  birthPlace: string | null;
  residenceAddress: string | null;
  residencePostalCode: string | null;
  residenceCity: string | null;
  residenceProvince: string | null;
  residenceCountry: string | null;
  documentType: string | null;
  documentNumber: string | null;
  documentAuthority: string | null;
  documentIssuedOn: Date | null;
  documentCountry: string | null;
  documentExpiresOn: Date | null;
}) {
  return {
    id: guest.id,
    firstName: guest.firstName,
    lastName: guest.lastName,
    email: guest.email,
    phone: guest.phone,
    sex: guest.sex,
    dateOfBirth: guest.dateOfBirth ? toISODate(guest.dateOfBirth) : null,
    birthPlace: guest.birthPlace,
    citizenship: guest.citizenship || guest.country,
    residenceAddress: guest.residenceAddress,
    residencePostalCode: guest.residencePostalCode,
    residenceCity: guest.residenceCity,
    residenceProvince: guest.residenceProvince,
    residenceCountry: guest.residenceCountry,
    documentType: knownDocumentType(guest.documentType),
    documentNumber: guest.documentNumber,
    documentAuthority: guest.documentAuthority,
    documentIssuedOn: guest.documentIssuedOn ? toISODate(guest.documentIssuedOn) : null,
    documentCountry: guest.documentCountry,
    documentExpiresOn: guest.documentExpiresOn ? toISODate(guest.documentExpiresOn) : null,
  };
}

function guestDocumentData(guest: {
  firstName: string;
  lastName: string;
  sex: string;
  dateOfBirth: string;
  birthPlace: string;
  citizenship: string;
  email: string | null;
  phone: string | null;
  residenceAddress: string;
  residencePostalCode: string | null;
  residenceCity: string;
  residenceProvince: string | null;
  residenceCountry: string;
  documentType: string;
  documentNumber: string;
  documentAuthority: string;
  documentIssuedOn: string;
  documentCountry: string;
  documentExpiresOn: string | null;
}) {
  return {
    firstName: guest.firstName,
    lastName: guest.lastName,
    sex: guest.sex,
    dateOfBirth: toDate(guest.dateOfBirth),
    birthPlace: guest.birthPlace,
    citizenship: guest.citizenship,
    country: guest.citizenship,
    email: guest.email,
    phone: guest.phone,
    residenceAddress: guest.residenceAddress,
    residencePostalCode: guest.residencePostalCode,
    residenceCity: guest.residenceCity,
    residenceProvince: guest.residenceProvince,
    residenceCountry: guest.residenceCountry,
    documentType: guest.documentType,
    documentNumber: guest.documentNumber,
    documentAuthority: guest.documentAuthority,
    documentIssuedOn: toDate(guest.documentIssuedOn),
    documentCountry: guest.documentCountry,
    documentExpiresOn: guest.documentExpiresOn ? toDate(guest.documentExpiresOn) : null,
  };
}

function summaryOf(
  id: string,
  guest: { firstName: string; lastName: string; documentType: string; documentNumber: string },
  isPrimary: boolean,
): StayGuestSummary {
  return {
    id,
    firstName: guest.firstName,
    lastName: guest.lastName,
    isPrimary,
    documentType: knownDocumentType(guest.documentType),
    documentLast4: documentLast4(guest.documentNumber),
  };
}

async function auditGuestDocument(
  tx: Prisma.TransactionClient,
  propertyId: string,
  userId: string | null | undefined,
  guestId: string,
  documentType: string,
  documentNumber: string,
) {
  await auditService.record({
    tx,
    propertyId,
    userId,
    action: "guest.document",
    entity: "Guest",
    entityId: guestId,
    after: { profileUpdated: true, ...documentAuditAfter(documentType, documentNumber) },
  });
}
