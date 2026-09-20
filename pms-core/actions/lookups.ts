"use server";

import { requirePermission, requireSession } from "@pms-core/auth/guards";
import { wrapAction } from "@pms-core/actions/result";
import { planningService } from "@pms-core/services/planning.service";
import { dashboardService } from "@pms-core/services/dashboard.service";
import { availabilityService } from "@pms-core/services/availability.service";
import { searchService } from "@pms-core/services/search.service";
import { notificationService } from "@pms-core/services/notification.service";
import { reportService } from "@pms-core/services/report.service";
import { reservationRepo } from "@pms-core/database/repositories/reservation.repo";
import { toISODate } from "@pms-core/lib/dates";

export async function getPlanningAction(from: string, to: string) {
  return wrapAction(async () => {
    const session = await requirePermission("planning.read");
    return planningService.get(session.propertyId, from, to);
  });
}

export async function getDashboardAction(from: string, to: string) {
  return wrapAction(async () => {
    const session = await requirePermission("dashboard.read");
    const [kpis, recent] = await Promise.all([
      dashboardService.kpis(session.propertyId, from, to),
      dashboardService.recent(session.propertyId),
    ]);
    return { kpis, recent };
  });
}

export async function getAvailabilityAction(input: {
  checkIn: string;
  checkOut: string;
  adults: number;
  children?: number;
  roomTypeId?: string;
}) {
  return wrapAction(async () => {
    const session = await requirePermission("availability.read");
    return availabilityService.search({ ...input, propertyId: session.propertyId });
  });
}

export async function searchAction(query: string) {
  return wrapAction(async () => {
    const session = await requireSession();
    return searchService.query(session.propertyId, query);
  });
}

export async function getNotificationsAction() {
  return wrapAction(async () => {
    const session = await requirePermission("notifications.read");
    const [items, unread] = await Promise.all([
      notificationService.list(session.propertyId),
      notificationService.unreadCount(session.propertyId),
    ]);
    return { items, unread };
  });
}

export async function markNotificationsReadAction(id?: string) {
  return wrapAction(async () => {
    const session = await requirePermission("notifications.write");
    if (id) await notificationService.markRead(id, session.propertyId);
    else await notificationService.markAllRead(session.propertyId);
    return { ok: true };
  });
}

export async function getReportsAction(from: string, to: string) {
  return wrapAction(async () => {
    const session = await requirePermission("reports.read");
    return reportService.summary(session.propertyId, from, to);
  });
}

export async function getReservationDetailAction(id: string) {
  return wrapAction(async () => {
    await requirePermission("reservations.read");
    const reservation = await reservationRepo.findById(id);
    if (!reservation) throw new Error("Prenotazione non trovata.");
    return {
      ...reservation,
      checkIn: toISODate(reservation.checkIn),
      checkOut: toISODate(reservation.checkOut),
      extras: reservation.extras.map((line) => ({
        name: line.extra.name,
        quantity: line.quantity,
        total: line.total,
      })),
    };
  });
}
