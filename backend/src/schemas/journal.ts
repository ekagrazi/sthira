import { z } from "zod";

import { uuidSchema } from "./common.js";

export const journalCreateBodySchema = z
  .object({
    checkin_id: uuidSchema.optional(),
    personal_note: z.string().trim().min(1).max(1_000).optional(),
    quote_id: uuidSchema,
    tags: z.array(z.string().trim().min(1).max(24)).max(5).optional(),
  })
  .strict();

export const journalListQuerySchema = z
  .object({
    cursor: z.string().min(1).max(256).optional(),
    limit: z.coerce.number().int().min(1).max(20).default(10),
  })
  .strict();

export const journalEntryIdSchema = uuidSchema;

export const journalUpdateBodySchema = z
  .object({
    personal_note: z.string().trim().max(1_000).nullable().optional(),
    tags: z.array(z.string().trim().min(1).max(24)).max(5).optional(),
  })
  .strict()
  .refine(
    (value) => value.personal_note !== undefined || value.tags !== undefined,
    { message: "At least one journal field is required." },
  );

export type JournalCreateBody = z.infer<typeof journalCreateBodySchema>;
export type JournalListQuery = z.infer<typeof journalListQuerySchema>;
export type JournalUpdateBody = z.infer<typeof journalUpdateBodySchema>;
