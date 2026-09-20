import { PrismaClient, type ReservationStatus, type RoomStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

import { propertyConfig } from "../config/property";

const prisma = new PrismaClient();

function d(iso: string) {
  return new Date(`${iso}T12:00:00.000Z`);
}

function nights(checkIn: string, checkOut: string) {
  return Math.round((d(checkOut).getTime() - d(checkIn).getTime()) / 86_400_000);
}

async function main() {
  await prisma.channelReservation.deleteMany();
  await prisma.channelRateMapping.deleteMany();
  await prisma.channelRoomMapping.deleteMany();
  await prisma.channelConnection.deleteMany();
  await prisma.channel.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.housekeepingTask.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.reservationExtra.deleteMany();
  await prisma.reservationGuest.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.rate.deleteMany();
  await prisma.ratePlanPrice.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.extra.deleteMany();
  await prisma.ratePlan.deleteMany();
  await prisma.room.deleteMany();
  await prisma.roomType.deleteMany();
  await prisma.guest.deleteMany();
  await prisma.user.deleteMany();
  await prisma.property.deleteMany();
  await prisma.organization.deleteMany();

  const organization = await prisma.organization.create({
    data: {
      name: propertyConfig.organizationName,
      slug: propertyConfig.organizationSlug,
    },
  });

  const property = await prisma.property.create({
    data: {
      organizationId: organization.id,
      name: propertyConfig.propertyName,
      slug: propertyConfig.propertySlug,
      address: propertyConfig.address,
      city: propertyConfig.city,
      postalCode: propertyConfig.postalCode,
      country: propertyConfig.country,
      timezone: propertyConfig.timezone,
      currency: propertyConfig.currency,
      language: propertyConfig.language,
      settings: JSON.stringify(propertyConfig.settings),
      reservationSeq: 1041,
    },
  });

  const passwordHash = await bcrypt.hash("Grauson2026!", 12);
  await prisma.user.createMany({
    data: [
      {
        organizationId: organization.id,
        propertyId: property.id,
        email: "michel.branche@grauson.local",
        passwordHash,
        firstName: "Michel",
        lastName: "Branche",
        role: "OWNER",
      },
      {
        organizationId: organization.id,
        propertyId: property.id,
        email: "reception@grauson.local",
        passwordHash,
        firstName: "Laura",
        lastName: "Guichardaz",
        role: "RECEPTIONIST",
      },
      {
        organizationId: organization.id,
        propertyId: property.id,
        email: "housekeeping@grauson.local",
        passwordHash,
        firstName: "Anna",
        lastName: "Foretier",
        role: "HOUSEKEEPING",
      },
    ],
  });

  const types = await Promise.all(
    [
      { name: "Standard", slug: "standard", capacity: 2, sortOrder: 1 },
      { name: "Superior", slug: "superior", capacity: 3, sortOrder: 2 },
      { name: "Deluxe", slug: "deluxe", capacity: 2, sortOrder: 3 },
      { name: "Junior Suite", slug: "junior-suite", capacity: 3, sortOrder: 4 },
      { name: "Suite", slug: "suite", capacity: 4, sortOrder: 5 },
      { name: "Family", slug: "family", capacity: 4, sortOrder: 6 },
    ].map((type) =>
      prisma.roomType.create({
        data: {
          propertyId: property.id,
          ...type,
          description: `Camera ${type.name} della locanda`,
          amenities: JSON.stringify(["Wi-Fi", "Bagno privato", "Riscaldamento"]),
        },
      }),
    ),
  );

  const typeBySlug = Object.fromEntries(types.map((type) => [type.slug, type]));

  const roomDefs: { number: string; slug: string; floor: number; status?: RoomStatus; notes?: string }[] = [
    { number: "101", slug: "standard", floor: 1 },
    { number: "102", slug: "standard", floor: 1 },
    { number: "103", slug: "superior", floor: 1 },
    { number: "104", slug: "superior", floor: 1, status: "CLEANING", notes: "In pulizia dopo partenza" },
    { number: "201", slug: "deluxe", floor: 2 },
    { number: "202", slug: "deluxe", floor: 2 },
    { number: "203", slug: "junior-suite", floor: 2 },
    { number: "204", slug: "suite", floor: 2 },
    { number: "301", slug: "family", floor: 3 },
    { number: "302", slug: "family", floor: 3 },
    { number: "303", slug: "standard", floor: 3 },
    { number: "304", slug: "standard", floor: 3, status: "OUT_OF_SERVICE", notes: "Manutenzione impianto" },
  ];

  const rooms = await Promise.all(
    roomDefs.map((room, index) =>
      prisma.room.create({
        data: {
          propertyId: property.id,
          roomTypeId: typeBySlug[room.slug].id,
          number: room.number,
          floor: room.floor,
          capacity: typeBySlug[room.slug].capacity,
          beds: typeBySlug[room.slug].capacity >= 3 ? "Matrimoniale + singolo" : "Matrimoniale",
          status: room.status ?? "AVAILABLE",
          notes: room.notes ?? "",
          sortOrder: index,
        },
      }),
    ),
  );
  const roomByNumber = Object.fromEntries(rooms.map((room) => [room.number, room]));

  const plans = await Promise.all(
    [
      {
        code: "BAR",
        name: "Best Available Rate",
        refundable: true,
        deposit: 0,
        policy: "Cancellazione gratuita fino a 48 ore prima.",
        prices: { standard: 120, superior: 150, deluxe: 180, "junior-suite": 210, suite: 260, family: 200 },
      },
      {
        code: "NON_REFUNDABLE",
        name: "Non rimborsabile",
        refundable: false,
        deposit: 100,
        policy: "Non rimborsabile. Pagamento dell'intero soggiorno alla prenotazione.",
        prices: { standard: 108, superior: 135, deluxe: 162, "junior-suite": 189, suite: 234, family: 180 },
      },
      {
        code: "HALF_BOARD",
        name: "Mezza pensione",
        refundable: true,
        deposit: 30,
        policy: "Cancellazione gratuita fino a 7 giorni prima.",
        prices: { standard: 160, superior: 190, deluxe: 220, "junior-suite": 250, suite: 300, family: 240 },
      },
      {
        code: "FULL_BOARD",
        name: "Pensione completa",
        refundable: true,
        deposit: 30,
        policy: "Cancellazione gratuita fino a 7 giorni prima.",
        prices: { standard: 190, superior: 220, deluxe: 250, "junior-suite": 280, suite: 330, family: 270 },
      },
    ].map((plan) =>
      prisma.ratePlan.create({
        data: {
          propertyId: property.id,
          code: plan.code,
          name: plan.name,
          cancellationPolicy: plan.policy,
          depositPercent: plan.deposit,
          isRefundable: plan.refundable,
          prices: {
            create: Object.entries(plan.prices).map(([slug, basePrice]) => ({
              roomTypeId: typeBySlug[slug].id,
              basePrice,
            })),
          },
        },
      }),
    ),
  );
  const bar = plans[0];

  const extras = await Promise.all(
    [
      { name: "Culla", price: 15, perNight: true },
      { name: "Cena degustazione", price: 45, perNight: false },
      { name: "Trasferimento Aosta", price: 40, perNight: false },
      { name: "Parcheggio coperto", price: 10, perNight: true },
    ].map((extra) => prisma.extra.create({ data: { propertyId: property.id, ...extra } })),
  );

  const guestDefs = [
    ["Marco", "Rossi", "rossi.marco@email.com", "+39 328 012 34567", "IT"],
    ["Laura", "Branche", "laura.branche@email.com", "+39 347 110 2233", "IT"],
    ["Hans", "Müller", "hans.mueller@email.de", "+49 151 220011", "DE"],
    ["Matteo", "Verdi", "matteo.verdi@email.com", "+39 333 445566", "IT"],
    ["Chiara", "Ferrari", "chiara.ferrari@email.com", "+39 349 778899", "IT"],
    ["Claire", "Dupont", "claire.dupont@email.fr", "+33 6 12003400", "FR"],
    ["Johnny", "Smith", "johnny.smith@email.uk", "+44 7700 900123", "GB"],
    ["Lucca", "Rinaldi", "lucca.rinaldi@email.com", "+39 320 556677", "IT"],
    ["Elena", "García", "elena.garcia@email.es", "+34 600 112233", "ES"],
    ["Piotr", "Nowak", "piotr.nowak@email.pl", "+48 500 334455", "PL"],
    ["Anna", "Esposito", "anna.esposito@email.com", "+39 338 990011", "IT"],
    ["Martina", "Keller", "martina.keller@email.ch", "+41 79 111 2233", "CH"],
    ["Davide", "Contrì", "davide.contri@email.com", "+39 331 223344", "IT"],
    ["Carlos", "Lopez", "carlos.lopez@email.es", "+34 611 998877", "ES"],
    ["Giulia", "Bianchi", "giulia.bianchi@email.com", "+39 340 121212", "IT"],
    ["Thomas", "Weber", "thomas.weber@email.de", "+49 160 445566", "DE"],
    ["Sofia", "Moretti", "sofia.moretti@email.com", "+39 345 667788", "IT"],
    ["James", "Brown", "james.brown@email.uk", "+44 7700 111222", "GB"],
    ["Alice", "Martin", "alice.martin@email.fr", "+33 6 99887766", "FR"],
    ["Luca", "Galli", "luca.galli@email.com", "+39 329 334455", "IT"],
    ["Nina", "Kowalski", "nina.kowalski@email.pl", "+48 512 667788", "PL"],
    ["Paolo", "Ricci", "paolo.ricci@email.com", "+39 346 778899", "IT"],
  ] as const;

  const guests = await Promise.all(
    guestDefs.map(([firstName, lastName, email, phone, country], index) =>
      prisma.guest.create({
        data: {
          propertyId: property.id,
          firstName,
          lastName,
          email,
          phone,
          country,
          vip: index === 0 || lastName === "Branche",
          notes: index === 0 ? "Ospite abituale, piano basso." : "",
          preferences: JSON.stringify(index % 3 === 0 ? ["piano alto", "silenzio"] : []),
        },
      }),
    ),
  );
  const guestByLast = Object.fromEntries(guests.map((guest) => [guest.lastName, guest]));

  type Stay = {
    last: string;
    room: string;
    from: string;
    to: string;
    adults: number;
    children?: number;
    status: ReservationStatus;
    total: number;
    notes?: string;
    source?: string;
  };

  const stays: Stay[] = [
    { last: "Rossi", room: "101", from: "2026-12-15", to: "2026-12-18", adults: 2, status: "CONFIRMED", total: 360 },
    { last: "Branche", room: "102", from: "2026-12-16", to: "2026-12-28", adults: 2, status: "CONFIRMED", total: 1440 },
    { last: "Müller", room: "103", from: "2026-12-16", to: "2026-12-20", adults: 2, status: "CONFIRMED", total: 600 },
    { last: "Verdi", room: "103", from: "2026-12-23", to: "2026-12-27", adults: 2, status: "CONFIRMED", total: 600 },
    { last: "Ferrari", room: "104", from: "2026-12-22", to: "2026-12-28", adults: 3, status: "CONFIRMED", total: 900 },
    { last: "Dupont", room: "201", from: "2026-12-15", to: "2026-12-19", adults: 2, status: "CONFIRMED", total: 720 },
    { last: "Smith", room: "201", from: "2026-12-23", to: "2026-12-27", adults: 2, status: "CONFIRMED", total: 720 },
    { last: "Rinaldi", room: "202", from: "2026-12-25", to: "2026-12-28", adults: 2, status: "CONFIRMED", total: 540 },
    { last: "García", room: "203", from: "2026-12-17", to: "2026-12-21", adults: 2, status: "CONFIRMED", total: 840 },
    { last: "Nowak", room: "204", from: "2026-12-15", to: "2026-12-19", adults: 4, status: "CONFIRMED", total: 1040 },
    { last: "Esposito", room: "301", from: "2026-12-18", to: "2026-12-23", adults: 3, children: 1, status: "CONFIRMED", total: 1000 },
    { last: "Keller", room: "302", from: "2026-12-24", to: "2026-12-28", adults: 2, children: 2, status: "CONFIRMED", total: 800 },
    { last: "Contrì", room: "303", from: "2026-12-16", to: "2026-12-20", adults: 2, status: "CONFIRMED", total: 480 },
    { last: "Lopez", room: "303", from: "2026-12-24", to: "2026-12-28", adults: 2, status: "CONFIRMED", total: 480 },
    { last: "Bianchi", room: "101", from: "2026-09-18", to: "2026-09-21", adults: 2, status: "CHECKED_IN", total: 360 },
    { last: "Weber", room: "102", from: "2026-09-19", to: "2026-09-23", adults: 2, status: "CONFIRMED", total: 480 },
    { last: "Moretti", room: "201", from: "2026-09-20", to: "2026-09-24", adults: 2, status: "CONFIRMED", total: 720, source: "website" },
    { last: "Brown", room: "203", from: "2026-09-17", to: "2026-09-20", adults: 2, status: "CHECKED_OUT", total: 630 },
    { last: "Martin", room: "204", from: "2026-09-20", to: "2026-09-25", adults: 3, status: "OPTION", total: 1300 },
    { last: "Galli", room: "301", from: "2026-09-21", to: "2026-09-26", adults: 2, children: 2, status: "CONFIRMED", total: 1000 },
    { last: "Kowalski", room: "103", from: "2026-09-22", to: "2026-09-25", adults: 2, status: "CONFIRMED", total: 450 },
    { last: "Ricci", room: "202", from: "2026-09-16", to: "2026-09-19", adults: 2, status: "CANCELLED", total: 540 },
    { last: "Rossi", room: "302", from: "2026-10-02", to: "2026-10-06", adults: 2, status: "INQUIRY", total: 800 },
    { last: "Ferrari", room: "104", from: "2026-09-12", to: "2026-09-15", adults: 2, status: "NO_SHOW", total: 450 },
  ];

  let seq = 1042;
  for (const stay of stays) {
    const guest = guestByLast[stay.last];
    const room = roomByNumber[stay.room];
    const stayNights = nights(stay.from, stay.to);
    const reservation = await prisma.reservation.create({
      data: {
        propertyId: property.id,
        code: `BK-2026-${seq}`,
        roomId: room.id,
        roomTypeId: room.roomTypeId,
        ratePlanId: bar.id,
        guestId: guest.id,
        status: stay.status,
        checkIn: d(stay.from),
        checkOut: d(stay.to),
        adults: stay.adults,
        children: stay.children ?? 0,
        nights: stayNights,
        roomRate: stay.total * 0.82,
        extrasTotal: stay.total * 0.08,
        taxesTotal: stay.total * 0.1,
        total: stay.total,
        notes: stay.notes ?? "",
        vip: guest.vip,
        source: stay.source ?? "pms",
        guests: { create: { guestId: guest.id, isPrimary: true } },
        extras: stay.last === "Rossi" && stay.from.startsWith("2026-12")
          ? { create: { extraId: extras[3].id, quantity: stayNights, unitPrice: 10, total: 10 * stayNights } }
          : undefined,
        payments:
          stay.status === "CONFIRMED" || stay.status === "CHECKED_IN"
            ? { create: { amount: stay.total * 0.3, method: "CARD", status: "COMPLETED" } }
            : undefined,
      },
    });
    if (stay.last === "Rossi" && stay.from === "2026-12-15") {
      await prisma.auditLog.create({
        data: {
          propertyId: property.id,
          action: "reservation.create",
          entity: "Reservation",
          entityId: reservation.id,
          after: JSON.stringify({ code: reservation.code, room: "101" }),
        },
      });
    }
    seq += 1;
  }

  await prisma.property.update({ where: { id: property.id }, data: { reservationSeq: seq - 1 } });

  await prisma.housekeepingTask.createMany({
    data: [
      { propertyId: property.id, roomId: roomByNumber["104"].id, status: "CLEANING", priority: "HIGH", notes: "Partenza mattutina" },
      { propertyId: property.id, roomId: roomByNumber["304"].id, status: "OUT_OF_SERVICE", priority: "URGENT", notes: "Manutenzione" },
      { propertyId: property.id, roomId: roomByNumber["101"].id, status: "OCCUPIED", priority: "NORMAL", notes: "Ospite in casa" },
    ],
  });

  await prisma.notification.createMany({
    data: [
      {
        propertyId: property.id,
        type: "reservation.created",
        title: "Nuova prenotazione",
        body: "Moretti Sofia · camera 201 · dal sito",
        entity: "Reservation",
      },
      {
        propertyId: property.id,
        type: "checkin.upcoming",
        title: "Check-in di oggi",
        body: "Martin Alice arriva in Suite 204",
      },
      {
        propertyId: property.id,
        type: "room.ready",
        title: "Camera pronta",
        body: "La 102 è ispezionata e disponibile",
        read: true,
      },
    ],
  });

  await prisma.channel.create({
    data: { type: "BOOKING_COM", name: "Booking.com", active: false },
  });

  console.log("PMS seed completed.");
  console.log("Login: michel.branche@grauson.local / Grauson2026!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
