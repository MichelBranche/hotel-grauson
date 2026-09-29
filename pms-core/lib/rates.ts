import { z } from "zod";

import { nightsBetween } from "@pms-core/lib/dates";

/** Longest range a season or closure may cover in one go. */
export const MAX_RANGE_NIGHTS = 400;

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data non valida.");

const optionalCount = (max: number) =>
  z.preprocess(
    (value) => (value === "" || value === undefined || (typeof value === "number" && Number.isNaN(value)) ? null : value),
    z.number().int().min(1, "Deve essere almeno 1.").max(max).nullable(),
  );

const optionalPrice = z.preprocess(
  (value) => (value === "" || value === undefined || (typeof value === "number" && Number.isNaN(value)) ? null : value),
  z.number().min(0, "Il prezzo non può essere negativo.").max(100_000).nullable(),
);

function checkRange(value: { startDate: string; endDate: string }, ctx: z.RefinementCtx) {
  if (value.endDate < value.startDate) {
    ctx.addIssue({ code: "custom", message: "La data di fine deve essere uguale o successiva all'inizio.", path: ["endDate"] });
  } else if (nightsBetween(value.startDate, value.endDate) >= MAX_RANGE_NIGHTS) {
    ctx.addIssue({ code: "custom", message: `L'intervallo non può superare ${MAX_RANGE_NIGHTS} notti.`, path: ["endDate"] });
  }
}

export const ratePlanInputSchema = z
  .object({
    name: z.string().trim().min(2, "Inserisci il nome della tariffa.").max(80),
    code: z.string().trim().min(1, "Inserisci il codice.").max(16, "Il codice è troppo lungo."),
    description: z.string().max(500).optional().default(""),
    cancellationPolicy: z.string().max(500).optional().default(""),
    depositPercent: z.number().min(0, "Minimo 0%.").max(100, "Massimo 100%."),
    minimumStay: z.number().int().min(1, "Deve essere almeno 1 notte.").max(60),
    maximumStay: optionalCount(365),
    isRefundable: z.boolean(),
    active: z.boolean(),
  })
  .refine((value) => value.maximumStay === null || value.maximumStay >= value.minimumStay, {
    message: "Il soggiorno massimo non può essere inferiore al minimo.",
    path: ["maximumStay"],
  });

export type RatePlanInput = z.input<typeof ratePlanInputSchema>;

export const planPricesSchema = z.array(
  z.object({ roomTypeId: z.string().min(1), basePrice: optionalPrice }),
);

export const seasonInputSchema = z
  .object({
    name: z.string().trim().min(2, "Inserisci il nome della stagione.").max(80),
    ratePlanId: z.string().min(1).nullable(),
    startDate: isoDate,
    endDate: isoDate,
    minStay: optionalCount(60),
    maxStay: optionalCount(365),
    closedToArrival: z.boolean(),
    closedToDeparture: z.boolean(),
    notes: z.string().max(500).optional().default(""),
    prices: z.array(z.object({ roomTypeId: z.string().min(1), price: optionalPrice })),
  })
  .superRefine(checkRange)
  .refine((value) => value.maxStay === null || value.minStay === null || value.maxStay >= value.minStay, {
    message: "Il soggiorno massimo non può essere inferiore al minimo.",
    path: ["maxStay"],
  });

export type SeasonInput = z.input<typeof seasonInputSchema>;

export const closureInputSchema = z
  .object({
    scope: z.enum(["roomType", "room"]),
    targetId: z.string().min(1, "Seleziona tipologia o camera."),
    startDate: isoDate,
    endDate: isoDate,
    reason: z.string().trim().max(160).optional().default(""),
  })
  .superRefine(checkRange);

export type ClosureInput = z.input<typeof closureInputSchema>;
