import { occupyingStatuses } from "@pms-core/config/status";
import { prisma } from "@pms-core/database/client";
import { eachISODate, toDate, toISODate } from "@pms-core/lib/dates";
import { roundMoney } from "@pms-core/lib/money";
import type { KpiSnapshot } from "@pms-core/types";

export const dashboardService = {
  async kpis(propertyId: string, from: string, to: string): Promise<KpiSnapshot> {
    const [rooms, reservations] = await Promise.all([
      prisma.room.findMany({ where: { propertyId } }),
      prisma.reservation.findMany({
        where: {
          propertyId,
          checkIn: { lt: toDate(to) },
          checkOut: { gt: toDate(from) },
          status: { notIn: ["CANCELLED"] },
        },
      }),
    ]);

    const today = from;
    const sellable = rooms.filter((room) => room.status !== "OUT_OF_ORDER" && room.status !== "OUT_OF_SERVICE");
    const occupying = reservations.filter((item) => occupyingStatuses.includes(item.status));
    const occupiedToday = occupying.filter(
      (item) => toISODate(item.checkIn) <= today && toISODate(item.checkOut) > today,
    ).length;
    const dates = eachISODate(from, to);
    const availableNights = sellable.length * Math.max(dates.length, 1);
    const occupiedNights = occupying.reduce((sum, item) => {
      const start = toISODate(item.checkIn) > from ? toISODate(item.checkIn) : from;
      const end = toISODate(item.checkOut) < to ? toISODate(item.checkOut) : to;
      return sum + Math.max(0, eachISODate(start, end).length);
    }, 0);
    const revenue = occupying.reduce((sum, item) => sum + item.roomRate, 0);
    const occupancy = availableNights ? occupiedNights / availableNights : 0;

    return {
      totalRooms: rooms.length,
      occupied: occupiedToday,
      free: Math.max(sellable.length - occupiedToday, 0),
      cleaning: rooms.filter((room) => room.status === "CLEANING" || room.status === "DIRTY").length,
      arrivals: reservations.filter((item) => toISODate(item.checkIn) === today && item.status !== "CANCELLED").length,
      departures: reservations.filter((item) => toISODate(item.checkOut) === today && item.status !== "CANCELLED").length,
      occupancy,
      adr: occupiedNights ? roundMoney(revenue / occupiedNights) : 0,
      revpar: availableNights ? roundMoney(revenue / availableNights) : 0,
      revenue: roundMoney(occupying.reduce((sum, item) => sum + item.total, 0)),
    };
  },

  recent(propertyId: string) {
    return prisma.reservation.findMany({
      where: { propertyId },
      include: { guest: true, room: true },
      orderBy: { createdAt: "desc" },
      take: 6,
    });
  },
};
