import { z } from "zod";
import type { RoomStatus } from "@prisma/client";

export const roomStatuses = [
  "AVAILABLE",
  "OCCUPIED",
  "DIRTY",
  "CLEANING",
  "INSPECTED",
  "OUT_OF_ORDER",
  "OUT_OF_SERVICE",
] as const satisfies readonly RoomStatus[];

export const roomTypeFieldsSchema = z.object({
  name: z.string().trim().min(2, "Inserisci il nome della tipologia."),
  code: z.string().trim().min(1, "Inserisci il codice.").max(16, "Il codice è troppo lungo."),
  description: z.string().optional().default(""),
  capacity: z.number().int().min(1, "Indica il numero massimo di ospiti.").max(20),
  maxAdults: z.number().int().min(1, "Indica gli adulti massimi.").max(20),
  maxChildren: z.number().int().min(0).max(12),
  sizeM2: z.preprocess(
    (value) => (typeof value === "number" && Number.isNaN(value) ? null : value),
    z.number().min(0).max(500).nullable().optional(),
  ),
  beds: z.string().optional().default(""),
  bathroom: z.string().optional().default(""),
  amenities: z.array(z.string()).optional().default([]),
  images: z.array(z.string()).optional().default([]),
  basePrice: z.number().min(0, "Il prezzo base non può essere negativo.").max(100_000),
  active: z.boolean().optional().default(true),
  sortOrder: z.number().int().optional(),
});

export const roomTypeInputSchema = roomTypeFieldsSchema
  .refine((value) => value.maxAdults <= value.capacity, {
    message: "Gli adulti massimi non possono superare gli ospiti massimi.",
    path: ["maxAdults"],
  })
  .refine((value) => value.capacity <= value.maxAdults + value.maxChildren, {
    message: "Gli ospiti massimi non possono superare adulti + bambini.",
    path: ["capacity"],
  });

export const roomInputSchema = z.object({
  number: z.string().trim().min(1, "Inserisci il numero o il nome camera.").max(20),
  name: z.string().trim().max(80).optional().nullable(),
  roomTypeId: z.string().min(1, "Seleziona una tipologia."),
  floorId: z.string().optional().nullable(),
  capacity: z.number().int().min(1, "Indica la capienza.").max(20),
  status: z.enum(roomStatuses),
  notes: z.string().optional().default(""),
  customBasePrice: z.preprocess(
    (value) => (typeof value === "number" && Number.isNaN(value) ? null : value),
    z.number().min(0).max(100_000).nullable().optional(),
  ),
  active: z.boolean().optional().default(true),
  sortOrder: z.number().int().optional(),
});

export const floorInputSchema = z.object({
  name: z.string().trim().min(1, "Inserisci il nome interno del piano.").max(40),
  displayName: z.string().trim().min(1, "Inserisci il nome visibile.").max(60),
  sortOrder: z.number().int().min(-20).max(200),
  description: z.string().optional().default(""),
  active: z.boolean().optional().default(true),
});

export type RoomTypeInput = z.infer<typeof roomTypeInputSchema>;
export type RoomInput = z.infer<typeof roomInputSchema>;
export type FloorInput = z.infer<typeof floorInputSchema>;

export function splitList(value: string) {
  return value
    .split(/[\n,;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}
