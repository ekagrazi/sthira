import { ResourceNotFoundError } from "../errors/app-error.js";
import {
  moodLabelSchema,
  moodThemeSchema,
  type MoodCheckinBody,
  type MoodRerollBody,
} from "../schemas/mood.js";
import type {
  MoodCheckinResponse,
  MoodHistoryResponse,
  MoodRerollResponse,
} from "../types/api.js";
import {
  keywordMoodLabel,
  type MoodAnalysisService,
} from "./sentiment-analysis.js";
import type {
  MoodCheckinsService,
  MoodHistoryRange,
} from "./mood-checkins.js";
import type { QuoteMatchingService } from "./quote-matching.js";

export interface MoodService {
  checkIn(userId: string, input: MoodCheckinBody): Promise<MoodCheckinResponse>;
  getResult(userId: string, checkinId: string): Promise<MoodCheckinResponse>;
  history(userId: string, range: MoodHistoryRange): Promise<MoodHistoryResponse>;
  reroll(userId: string, input: MoodRerollBody): Promise<MoodRerollResponse>;
}

export function createMoodService({
  analysis,
  checkins,
  quotes,
}: {
  analysis: MoodAnalysisService;
  checkins: MoodCheckinsService;
  quotes: QuoteMatchingService;
}): MoodService {
  return {
    async checkIn(userId, input) {
      const mood = await analysis.analyze(input);
      const matchedMoodLabel =
        input.mood_label ?? (input.free_text ? keywordMoodLabel(input.free_text) : null);
      const match = await quotes.match({
        guideSlug: mood.suggestedGuideSlug,
        ...(matchedMoodLabel && { moodLabel: matchedMoodLabel }),
        theme: mood.theme,
      });
      const checkin = await checkins.create({
        detectedTheme: mood.theme,
        freeText: input.free_text ?? null,
        matchedGuideId: match.guide.id,
        matchedQuoteId: match.quote.id,
        moodEmoji: input.mood_emoji ?? null,
        moodLabel: input.mood_label ?? null,
        sentimentScore: mood.sentimentScore,
        userId,
      });

      return {
        checkin,
        matched_guide: match.guide,
        matched_quote: match.quote,
      };
    },
    async history(userId, range) {
      const page = await checkins.history(userId, range);
      return { history: page.items, next_cursor: page.nextCursor };
    },
    async getResult(userId, checkinId) {
      const checkin = await checkins.findOwned(checkinId, userId);
      if (!checkin?.matched_guide_id || !checkin.matched_quote_id) {
        throw new ResourceNotFoundError("Mood result not found.");
      }

      const match = await quotes.findMatch(
        checkin.matched_guide_id,
        checkin.matched_quote_id,
      );
      if (!match) throw new ResourceNotFoundError("Mood result not found.");

      return {
        checkin: {
          created_at: checkin.created_at,
          detected_theme: checkin.detected_theme,
          id: checkin.id,
          matched_guide_id: checkin.matched_guide_id,
          matched_quote_id: checkin.matched_quote_id,
          mood_emoji: checkin.mood_emoji,
          mood_label: checkin.mood_label,
          sentiment_score: checkin.sentiment_score,
        },
        matched_guide: match.guide,
        matched_quote: match.quote,
      };
    },
    async reroll(userId, input) {
      const checkin = await checkins.findOwned(input.checkin_id, userId);
      if (!checkin) throw new ResourceNotFoundError("Mood check-in not found.");

      const parsedTheme = moodThemeSchema.safeParse(checkin.detected_theme);
      const parsedMoodLabel = moodLabelSchema.safeParse(checkin.mood_label);
      const match = await quotes.match({
        guideSlug: input.guide_slug,
        ...(checkin.matched_quote_id && {
          excludedQuoteId: checkin.matched_quote_id,
        }),
        ...(parsedMoodLabel.success && { moodLabel: parsedMoodLabel.data }),
        ...(parsedTheme.success && { theme: parsedTheme.data }),
      });

      const updated = await checkins.updateMatch(
        checkin.id,
        userId,
        match.guide.id,
        match.quote.id,
      );
      if (!updated) throw new ResourceNotFoundError("Mood check-in not found.");

      return { matched_guide: match.guide, matched_quote: match.quote };
    },
  };
}
