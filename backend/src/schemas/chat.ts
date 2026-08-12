import { z } from "zod";

import { guideSlugValueSchema } from "./mood.js";
import { uuidSchema } from "./common.js";

export const chatSessionCreateBodySchema = z.union([
  z
    .object({
      guide_slug: guideSlugValueSchema,
      mode: z.literal("guide").optional(),
    })
    .strict(),
  z.object({ mode: z.literal("companion") }).strict(),
]);

export const chatSessionListQuerySchema = z
  .object({
    before: z.iso.datetime({ offset: true }).optional(),
    limit: z.coerce.number().int().min(1).max(20).default(10),
    mode: z.enum(["guide", "companion"]).optional(),
  })
  .strict();

export const chatSessionIdSchema = uuidSchema;

export const chatMessageListQuerySchema = z
  .object({
    before: z.iso.datetime({ offset: true }).optional(),
    limit: z.coerce.number().int().min(1).max(50).default(30),
  })
  .strict();

export const chatMessageSubmitBodySchema = z
  .object({
    client_action_id: uuidSchema,
    content: z
      .string()
      .min(1)
      .max(2_000)
      .refine((value) => value.trim().length > 0),
  })
  .strict();

export type ChatSessionCreateBody = z.infer<typeof chatSessionCreateBodySchema>;
export type ChatSessionListQuery = z.infer<typeof chatSessionListQuerySchema>;
export type ChatMessageListQuery = z.infer<typeof chatMessageListQuerySchema>;
export type ChatMessageSubmitBody = z.infer<typeof chatMessageSubmitBodySchema>;
