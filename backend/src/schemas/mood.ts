import { z } from "zod";

import {
  GUIDE_SLUGS,
  MOOD_EMOJIS,
  MOOD_LABELS,
  MOOD_THEMES,
} from "../data/mood-vocabulary.js";
import { uuidSchema } from "./common.js";

export const guideSlugValueSchema = z.enum(GUIDE_SLUGS);
export const moodEmojiSchema = z.enum(MOOD_EMOJIS);
export const moodLabelSchema = z.enum(MOOD_LABELS);
export const moodThemeSchema = z.enum(MOOD_THEMES);

export const moodCheckinBodySchema = z
  .object({
    free_text: z.string().trim().min(1).max(500).optional(),
    mood_emoji: moodEmojiSchema.optional(),
    mood_label: moodLabelSchema.optional(),
  })
  .strict()
  .refine(
    (value) => Boolean(value.free_text || value.mood_emoji || value.mood_label),
    { message: "At least one mood input is required." },
  );

export const moodRerollBodySchema = z
  .object({
    checkin_id: uuidSchema,
    guide_slug: guideSlugValueSchema,
  })
  .strict();

export const moodHistoryQuerySchema = z
  .object({
    before: z.iso.datetime({ offset: true }).optional(),
    from: z.iso.datetime({ offset: true }).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
    to: z.iso.datetime({ offset: true }).optional(),
  })
  .strict();

export const moodAnalysisResultSchema = z.object({
  sentimentScore: z.number().min(-1).max(1),
  suggestedGuideSlug: guideSlugValueSchema,
  theme: moodThemeSchema,
});

export type MoodCheckinBody = z.infer<typeof moodCheckinBodySchema>;
export type MoodRerollBody = z.infer<typeof moodRerollBodySchema>;
