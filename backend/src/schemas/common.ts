import { z } from "zod";

export const guideSlugSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u);

export const uuidSchema = z.uuid();

export const paginationSchema = z
  .object({
    cursor: z.string().min(1).max(128).optional(),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  })
  .strict();
