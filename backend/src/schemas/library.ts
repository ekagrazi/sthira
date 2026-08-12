import { z } from "zod";

import { QUOTE_THEMES } from "../data/mood-vocabulary.js";
import { guideSlugValueSchema } from "./mood.js";

export const libraryListQuerySchema = z
  .object({
    cursor: z.string().min(1).max(512).optional(),
    guide_slug: guideSlugValueSchema.optional(),
    limit: z.coerce.number().int().min(1).max(24).default(12),
    query: z
      .string()
      .trim()
      .min(2)
      .max(80)
      .regex(/^[\p{L}\p{N}\s'’-]+$/u)
      .optional(),
    theme: z.enum(QUOTE_THEMES).optional(),
  })
  .strict();

export type LibraryListQuery = z.infer<typeof libraryListQuerySchema>;
