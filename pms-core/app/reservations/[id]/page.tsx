import Link from "next/link";
import { notFound } from "next/navigation";

import { requirePermission } from "@pms-core/auth/guards";
import { ReservationDesk } from "@pms-core/components/reservations/reservation-desk";
import { can, canForceCancel } from "@pms-core/config/permissions";
import { propertyConfig } from "@pms-core/config/property";
import { prisma } from "@pms-core/database/client";
import { reservationRepo } from "@pms-core/database/repositories/reservation.repo";
import { todayInTimeZone, toISODate } from "@pms-core/lib/dates";
import { isPayAtPropertyRequest } from "@pms-core/lib/pay-at-property";
import { optionExpiryLabel } from "@pms-core/lib/option-hold";
import { roundMoney } from "@pms-core/lib/money";
import { guestDisplay, parseJson } from "@pms-core/lib/utils";
import { auditService } from "@pms-core/services/audit.service";
import { rateService } from "@pms-core/services/rate.service";
import type { PlanningReservation, PlanningRoom } from "@pms-core/types";

export default async function ReservationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requirePermission("reservations.read");
  const { id } = await params;
  const reservation = await reservationRepo.findById(id);
  if (!reservation || reservation.propertyId !== session.propertyId) notFound();

  const [audit, rooms, plans, extras, property] = await Promise.all([
    auditService.list(reservation.propertyId, reservation.id),
    prisma.room.findMany({
      where: { propertyId: reservation.propertyId },
      include: { roomType: true, assignedFloor: true },
      orderBy: { number: "asc" },
    }),
    prisma.ratePlan.findMany({
      where: {
        propertyId: reservation.propertyId,
        OR: [{ active: true }, ...(reservation.ratePlanId ? [{ id: reservation.ratePlanId }] : [])],
      },
      select: { id: true, code: true, name: true },
      orderBy: { createdAt: "asc" },
    }),
    rateService.extras(reservation.propertyId),
    prisma.property.findUnique({ where: { id: reservation.propertyId }, select: { timezone: true } }),
  ]);

  const timeZone = property?.timezone || propertyConfig.timezone;
  const paid = roundMoney(reservation.payments.reduce((sum, payment) => sum + payment.amount, 0));
  const view: PlanningReservation = {
    id: reservation.id,
    code: reservation.code,
    roomId: reservation.roomId,
    roomNumber: reservation.room.number,
    roomTypeName: reservation.roomType.name,
    guestId: reservation.guestId,
    guestName: guestDisplay(reservation.guest.firstName, reservation.guest.lastName),
    guestFirstName: reservation.guest.firstName,
    guestLastName: reservation.guest.lastName,
    ratePlanId: reservation.ratePlanId,
    email: reservation.guest.email,
    phone: reservation.guest.phone,
    country: reservation.guest.country,
    adults: reservation.adults,
    children: reservation.children,
    checkIn: toISODate(reservation.checkIn),
    checkOut: toISODate(reservation.checkOut),
    nights: reservation.nights,
    status: reservation.status,
    total: reservation.total,
    currency: reservation.currency,
    notes: reservation.notes,
    payAtProperty: isPayAtPropertyRequest(reservation),
    vip: reservation.vip,
    color: "#dce8dc",
  };
  const planningRooms: PlanningRoom[] = rooms.map((room) => ({
    id: room.id,
    number: room.number,
    name: room.name,
    floor: room.floor,
    floorId: room.floorId,
    floorName: room.assignedFloor?.displayName ?? null,
    capacity: room.capacity,
    status: room.status,
    roomTypeId: room.roomTypeId,
    roomTypeName: room.roomType.name,
    active: room.active,
  }));

  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-2">
        <ReservationDesk
          reservation={view}
          stay={{
            status: reservation.status,
            roomStatus: reservation.room.status,
            roomRate: reservation.roomRate,
            extrasTotal: reservation.extrasTotal,
            taxesTotal: reservation.taxesTotal,
            paid,
          }}
          rooms={planningRooms}
          plans={plans}
          extras={extras}
          businessToday={todayInTimeZone(timeZone)}
          expiresLabel={optionExpiryLabel({ status: reservation.status, createdAt: reservation.createdAt, timeZone })}
          balance={roundMoney(Math.max(0, reservation.total - paid))}
          permissions={{
            canWrite: can(session.role, "reservations.write"),
            canModify: can(session.role, "planning.move"),
            canCancel: can(session.role, "reservations.cancel"),
            canCheckIn: can(session.role, "reservations.checkin"),
            canPay: can(session.role, "payments.write"),
            canExtra: can(session.role, "reservations.write"),
            canForceCancel: canForceCancel(session.role),
          }}
        />
        <section className="pms-card p-5">
          <h2 className="text-sm text-[var(--pms-muted)]">Audit</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {audit.map((entry) => (
              <li key={entry.id}>
                <p className="font-medium">{entry.action}</p>
                <p className="text-xs text-[var(--pms-muted)]">
                  {entry.user ? `${entry.user.firstName} ${entry.user.lastName}` : "Sistema"} · {entry.createdAt.toLocaleString("it-IT")}
                </p>
                {entry.after ? <p className="text-xs text-[var(--pms-muted)]">{JSON.stringify(parseJson(entry.after, {}))}</p> : null}
              </li>
            ))}
          </ul>
          <Link href="/pms/planning" className="mt-4 inline-block text-xs underline">
            Apri nel planning
          </Link>
        </section>
      </div>
    </div>
  );
}
