import type { SupabaseClient } from "@supabase/supabase-js";

import { DependencyUnavailableError } from "../errors/app-error.js";
import type { MoodCheckin } from "../types/api.js";
import type { Database } from "../types/database.js";

const moodCheckinFields =
  "id, mood_emoji, mood_label, sentiment_score, detected_theme, matched_guide_id, matched_quote_id, created_at" as const;
const ownedCheckinFields = moodCheckinFields;

export type NewMoodCheckin = {
  detectedTheme: string;
  freeText: string | null;
  matchedGuideId: string;
  matchedQuoteId: string;
  moodEmoji: string | null;
  moodLabel: string | null;
  sentimentScore: number;
  userId: string;
};

export type OwnedMoodCheckin = MoodCheckin;

export type MoodHistoryRange = {
  before?: string;
  from: string;
  limit: number;
  to: string;
};

export type MoodHistoryPage = {
  items: MoodCheckin[];
  nextCursor: string | null;
};

export interface MoodCheckinsService {
  create(input: NewMoodCheckin): Promise<MoodCheckin>;
  findOwned(checkinId: string, userId: string): Promise<OwnedMoodCheckin | null>;
  history(userId: string, range: MoodHistoryRange): Promise<MoodHistoryPage>;
  updateMatch(
    checkinId: string,
    userId: string,
    guideId: string,
    quoteId: string,
  ): Promise<OwnedMoodCheckin | null>;
}

function unavailable(): DependencyUnavailableError {
  return new DependencyUnavailableError("Mood check-ins are temporarily unavailable.");
}

export function createSupabaseMoodCheckinsService(
  supabase: SupabaseClient<Database>,
): MoodCheckinsService {
  return {
    async create(input) {
      const { data, error } = await supabase
        .from("mood_checkins")
        .insert({
          detected_theme: input.detectedTheme,
          free_text: input.freeText,
          matched_guide_id: input.matchedGuideId,
          matched_quote_id: input.matchedQuoteId,
          mood_emoji: input.moodEmoji,
          mood_label: input.moodLabel,
          sentiment_score: input.sentimentScore,
          user_id: input.userId,
        })
        .select(moodCheckinFields)
        .single();

      if (error || !data) throw unavailable();
      return data;
    },
    async findOwned(checkinId, userId) {
      const { data, error } = await supabase
        .from("mood_checkins")
        .select(ownedCheckinFields)
        .eq("id", checkinId)
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle();

      if (error) throw unavailable();
      return data;
    },
    async history(userId, range) {
      let query = supabase
        .from("mood_checkins")
        .select(moodCheckinFields)
        .eq("user_id", userId)
        .gte("created_at", range.from)
        .lte("created_at", range.to)
        .order("created_at", { ascending: false })
        .limit(range.limit + 1);

      if (range.before) query = query.lt("created_at", range.before);

      const { data, error } = await query;
      if (error || !data) throw unavailable();

      const hasMore = data.length > range.limit;
      const items = hasMore ? data.slice(0, range.limit) : data;
      return {
        items,
        nextCursor: hasMore ? (items.at(-1)?.created_at ?? null) : null,
      };
    },
    async updateMatch(checkinId, userId, guideId, quoteId) {
      const { data, error } = await supabase
        .from("mood_checkins")
        .update({ matched_guide_id: guideId, matched_quote_id: quoteId })
        .eq("id", checkinId)
        .eq("user_id", userId)
        .select(ownedCheckinFields)
        .limit(1)
        .maybeSingle();

      if (error) throw unavailable();
      return data;
    },
  };
}
