import { occupyingStatuses } from "@pms-core/config/status";
import { prisma } from "@pms-core/database/client";
import { eachISODate, toDate, toISODate } from "@pms-core/lib/dates";
import { roundMoney } from "@pms-core/lib/money";

export const reportService = {
  async summary(propertyId: string, from: string, to: string) {
    const [rooms, reservations] = await Promise.all([
      prisma.room.findMany({ where: { propertyId } }),
      prisma.reservation.findMany({
        where: {
          propertyId,
          checkIn: { lt: toDate(to) },
          checkOut: { gt: toDate(from) },
        },
        include: { guest: true },
      }),
    ]);

    const sellable = rooms.filter(
      (room) => room.active && room.status !== "OUT_OF_ORDER" && room.status !== "OUT_OF_SERVICE",
    ).length;
    const occupying = reservations.filter((item) => occupyingStatuses.includes(item.status));
    const dates = eachISODate(from, to);
    const series = dates.map((date) => {
      const occupied = occupying.filter(
        (item) => toISODate(item.checkIn) <= date && toISODate(item.checkOut) > date,
      ).length;
      const dayRevenue = occupying
        .filter((item) => toISODate(item.checkIn) <= date && toISODate(item.checkOut) > date)
        .reduce((sum, item) => sum + item.roomRate / Math.max(item.nights, 1), 0);
      return {
        date,
        occupancy: sellable ? occupied / sellable : 0,
        occupied,
        revenue: roundMoney(dayRevenue),
      };
    });

    const occupiedNights = series.reduce((sum, day) => sum + day.occupied, 0);
    const revenue = occupying.reduce((sum, item) => sum + item.roomRate, 0);
    const nights = occupying.reduce((sum, item) => sum + item.nights, 0);

    return {
      occupancy: series.length && sellable ? occupiedNights / (series.length * sellable) : 0,
      adr: occupiedNights ? roundMoney(revenue / occupiedNights) : 0,
      revpar: series.length && sellable ? roundMoney(revenue / (series.length * sellable)) : 0,
      revenue: roundMoney(occupying.reduce((sum, item) => sum + item.total, 0)),
      arrivals: reservations.filter((item) => toISODate(item.checkIn) >= from && toISODate(item.checkIn) < to).length,
      departures: reservations.filter((item) => toISODate(item.checkOut) >= from && toISODate(item.checkOut) < to).length,
      cancellations: reservations.filter((item) => item.status === "CANCELLED").length,
      noShows: reservations.filter((item) => item.status === "NO_SHOW").length,
      alos: occupying.length ? roundMoney(nights / occupying.length) : 0,
      series,
    };
  },
};
