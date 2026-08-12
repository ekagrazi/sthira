import type { SupabaseClient } from "@supabase/supabase-js";

import { DependencyUnavailableError } from "../errors/app-error.js";
import type { StreakSummary } from "../types/api.js";
import type { Database } from "../types/database.js";

export type StreakUpdateInput = {
  checkinAt: Date;
  timezone: string;
  userId: string;
};

export interface StreakService<TStreak> {
  recordCheckin(input: StreakUpdateInput): Promise<TStreak>;
}

export interface StreakSummaryService {
  get(userId: string): Promise<StreakSummary>;
}

export function createSupabaseStreakSummaryService(
  supabase: SupabaseClient<Database>,
): StreakSummaryService {
  return {
    async get(userId) {
      const { data, error } = await supabase
        .from("user_streaks")
        .select("current_streak, longest_streak, last_checkin_date")
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle();
      if (error) {
        throw new DependencyUnavailableError("Streak is temporarily unavailable.");
      }

      return data ?? {
        current_streak: 0,
        last_checkin_date: null,
        longest_streak: 0,
      };
    },
  };
}
