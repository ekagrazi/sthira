import { z } from "zod";

import {
  GUIDE_SLUGS,
  MOOD_EMOJI_PROFILES,
  MOOD_KEYWORDS,
  MOOD_LABEL_PROFILES,
  MOOD_LABELS,
  MOOD_THEMES,
  NEUTRAL_MOOD_PROFILE,
  type MoodLabel,
  type MoodProfile,
} from "../data/mood-vocabulary.js";
import {
  guideSlugValueSchema,
  moodThemeSchema,
} from "../schemas/mood.js";
import type { MoodCheckinBody } from "../schemas/mood.js";
import { LlmGatewayError, type LlmGateway } from "./llm.js";

const providerMoodResultSchema = z
  .object({
    sentiment_score: z.number().finite(),
    suggested_guide_slug: guideSlugValueSchema,
    theme: moodThemeSchema,
  })
  .strict();

export type MoodAnalysisResult = {
  sentimentScore: number;
  suggestedGuideSlug: (typeof GUIDE_SLUGS)[number];
  theme: (typeof MOOD_THEMES)[number];
};

export interface MoodAnalysisService {
  analyze(input: MoodCheckinBody): Promise<MoodAnalysisResult>;
}

function normalizeForKeywords(value: string): string {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("en")
    .replace(/[^\p{L}\p{N}']+/gu, " ")
    .trim();
}

function includesPhrase(normalizedText: string, phrase: string): boolean {
  return ` ${normalizedText} `.includes(` ${phrase} `);
}

function resultFromProfile(profile: MoodProfile): MoodAnalysisResult {
  return {
    sentimentScore: profile.sentimentScore,
    suggestedGuideSlug: profile.guideSlug,
    theme: profile.theme,
  };
}

export function keywordMoodLabel(freeText: string): MoodLabel | null {
  const normalizedText = normalizeForKeywords(freeText);

  for (const label of MOOD_LABELS) {
    if (MOOD_KEYWORDS[label].some((keyword) => includesPhrase(normalizedText, keyword))) {
      return label;
    }
  }

  return null;
}

export function deterministicMoodAnalysis(
  input: MoodCheckinBody,
): MoodAnalysisResult {
  const keywordLabel = input.free_text ? keywordMoodLabel(input.free_text) : null;
  if (keywordLabel) {
    return resultFromProfile(MOOD_LABEL_PROFILES[keywordLabel]);
  }

  if (input.mood_label) {
    return resultFromProfile(MOOD_LABEL_PROFILES[input.mood_label]);
  }

  if (input.mood_emoji) {
    return resultFromProfile(MOOD_EMOJI_PROFILES[input.mood_emoji]);
  }

  return resultFromProfile(NEUTRAL_MOOD_PROFILE);
}

export function createMoodAnalysisService(llm: LlmGateway): MoodAnalysisService {
  return {
    async analyze(input) {
      const fallback = deterministicMoodAnalysis(input);

      try {
        const result = await llm.completeJson(
          {
            maxTokens: 160,
            messages: [
              {
                content: [
                  "Analyze the mood input.",
                  `Allowed themes: ${MOOD_THEMES.join(", ")}.`,
                  `Allowed guide slugs: ${GUIDE_SLUGS.join(", ")}.`,
                  "Return only the requested JSON fields. Do not add advice or explanation.",
                ].join(" "),
                role: "system",
              },
              {
                content: JSON.stringify(input),
                role: "user",
              },
            ],
            responseFormat: {
              name: "mood_analysis",
              schema: {
                additionalProperties: false,
                properties: {
                  sentiment_score: { type: "number" },
                  suggested_guide_slug: {
                    enum: [...GUIDE_SLUGS],
                    type: "string",
                  },
                  theme: { enum: [...MOOD_THEMES], type: "string" },
                },
                required: ["sentiment_score", "theme", "suggested_guide_slug"],
                type: "object",
              },
              strict: true,
            },
            temperature: 0.1,
          },
          providerMoodResultSchema,
        );

        return {
          sentimentScore: Math.max(-1, Math.min(1, result.data.sentiment_score)),
          suggestedGuideSlug: result.data.suggested_guide_slug,
          theme: result.data.theme,
        };
      } catch (error) {
        if (error instanceof LlmGatewayError) {
          return fallback;
        }

        throw error;
      }
    },
  };
}
