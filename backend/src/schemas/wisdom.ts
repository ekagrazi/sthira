import { z } from "zod";

import { guideSlugValueSchema } from "./mood.js";

export const wisdomQuerySchema = z
  .object({
    guide_slug: guideSlugValueSchema.optional(),
    limit: z.coerce.number().int().min(1).max(5).default(3),
  })
  .strict();
