import type { RoomStatus } from "@prisma/client";

export type StructureRoom = {
  id: string;
  number: string;
  name: string | null;
  floor: number;
  floorId: string | null;
  floorName: string | null;
  capacity: number;
  status: RoomStatus;
  notes: string;
  active: boolean;
  customBasePrice: number | null;
  roomTypeId: string;
  roomTypeName: string;
  roomTypeCode: string;
  displayPrice: number;
};

export type StructureType = {
  id: string;
  name: string;
  code: string;
  description: string;
  capacity: number;
  maxAdults: number;
  maxChildren: number;
  sizeM2: number | null;
  beds: string;
  bathroom: string;
  amenities: string[];
  images: string[];
  basePrice: number;
  active: boolean;
  sortOrder: number;
  roomCount: number;
};

export type StructureFloor = {
  id: string;
  name: string;
  displayName: string;
  sortOrder: number;
  description: string;
  active: boolean;
  roomCount: number;
};

export type StructurePermissions = {
  rooms: boolean;
  roomTypes: boolean;
  floors: boolean;
};
