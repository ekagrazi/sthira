import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { DependencyUnavailableError } from "../errors/app-error.js";
import type { InsightsRange } from "../schemas/insights.js";
import type { InsightsResponse } from "../types/api.js";
import type { Database } from "../types/database.js";

const countSchema = z.number().int().nonnegative();
const insightsResponseSchema = z.object({
  guide_distribution: z.array(z.object({
    count: countSchema,
    guide_id: z.uuid(),
    name: z.string(),
    slug: z.string(),
  })),
  heatmap: z.array(z.object({
    count: countSchema,
    date: z.iso.date(),
  })),
  mood_points: z.array(z.object({
    date: z.iso.date(),
    sentiment_score: z.number().min(-1).max(1),
  })),
  summary: z.object({
    current_streak: countSchema,
    longest_streak: countSchema,
    most_active_weekday: z.string().nullable(),
    top_guide: z.object({
      count: countSchema,
      guide_id: z.uuid(),
      name: z.string(),
      slug: z.string(),
    }).nullable(),
    total_checkins: countSchema,
  }),
  theme_counts: z.array(z.object({
    count: countSchema,
    theme: z.string(),
  })),
});

export interface InsightsService {
  get(userId: string, range: InsightsRange): Promise<InsightsResponse>;
}

export function createSupabaseInsightsService(
  supabase: SupabaseClient<Database>,
): InsightsService {
  return {
    async get(userId, range) {
      const { data, error } = await supabase.rpc("get_user_insights", {
        p_from: range.from,
        p_to: range.to,
        p_user_id: userId,
      });
      const parsed = insightsResponseSchema.safeParse(data);
      if (error || !parsed.success) {
        throw new DependencyUnavailableError("Insights are temporarily unavailable.");
      }
      return parsed.data;
    },
  };
}
