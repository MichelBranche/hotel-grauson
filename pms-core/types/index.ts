import type {
  Guest,
  Payment,
  Reservation,
  ReservationStatus,
  Room,
  RoomStatus,
  RoomType,
  UserRole,
} from "@prisma/client";

export type SessionUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  propertyId: string;
  organizationId: string;
};

export type PlanningView = "day" | "week" | "twoweeks" | "month";

export type PlanningReservation = {
  id: string;
  code: string;
  roomId: string;
  roomNumber: string;
  roomTypeName: string;
  guestId: string;
  guestName: string;
  email: string | null;
  phone: string | null;
  adults: number;
  children: number;
  checkIn: string;
  checkOut: string;
  nights: number;
  status: ReservationStatus;
  total: number;
  currency: string;
  notes: string;
  vip: boolean;
  color: string;
};

export type PlanningRoom = {
  id: string;
  number: string;
  name: string | null;
  floor: number;
  floorId: string | null;
  floorName: string | null;
  capacity: number;
  status: RoomStatus;
  roomTypeId: string;
  roomTypeName: string;
  active: boolean;
};

export type PlanningData = {
  propertyId: string;
  from: string;
  to: string;
  rooms: PlanningRoom[];
  reservations: PlanningReservation[];
};

export type AvailabilityOffer = {
  roomTypeId: string;
  roomTypeName: string;
  capacity: number;
  availableRooms: { id: string; number: string }[];
  remaining: number;
  ratePlans: {
    id: string;
    code: string;
    name: string;
    refundable: boolean;
    nightly: number;
    total: number;
    minimumStay: number;
  }[];
};

export type ReservationDetail = Reservation & {
  guest: Guest;
  room: Room & { roomType: RoomType };
  roomType: RoomType;
  payments: Payment[];
  extras: { name: string; quantity: number; total: number }[];
  guests: { guest: Guest; isPrimary: boolean }[];
};

export type KpiSnapshot = {
  totalRooms: number;
  occupied: number;
  free: number;
  cleaning: number;
  outOfOrder: number;
  arrivals: number;
  departures: number;
  occupancy: number;
  adr: number;
  revpar: number;
  revenue: number;
};
