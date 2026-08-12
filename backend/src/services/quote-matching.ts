import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  GuideSlug,
  MoodLabel,
  MoodTheme,
} from "../data/mood-vocabulary.js";
import {
  DependencyUnavailableError,
  ResourceNotFoundError,
} from "../errors/app-error.js";
import type { Database } from "../types/database.js";
import type { PublicGuide, PublicQuote } from "../types/api.js";
import type { GuidesService } from "./guides.js";

const quoteFields = "id, guide_id, text, citation, themes, mood_tags, content_type, source_work, source_url, translator, rights_basis" as const;
const candidateLimitPerFilter = 12;
const guideFallbackLimit = 24;

export type QuoteMatchInput = {
  excludedQuoteId?: string;
  guideSlug: GuideSlug;
  moodLabel?: MoodLabel;
  theme?: MoodTheme;
};

export type QuoteMatch = {
  guide: PublicGuide;
  quote: PublicQuote;
};

export interface QuoteMatchingService {
  findMatch(guideId: string, quoteId: string): Promise<QuoteMatch | null>;
  match(input: QuoteMatchInput): Promise<QuoteMatch>;
  wisdom(limit: number): Promise<QuoteMatch[]>;
}

export interface QuoteRepository {
  findById(quoteId: string): Promise<PublicQuote | null>;
  findByGuide(guideId: string): Promise<PublicQuote[]>;
  findByMoodTag(guideId: string, moodLabel: MoodLabel): Promise<PublicQuote[]>;
  findByTheme(guideId: string, theme: MoodTheme): Promise<PublicQuote[]>;
  list(limit: number): Promise<PublicQuote[]>;
}

function ensureQuerySucceeded(
  result: { data: PublicQuote[] | null; error: unknown },
): PublicQuote[] {
  if (result.error || !result.data) {
    throw new DependencyUnavailableError("Quotes are temporarily unavailable.");
  }

  return result.data;
}

export function createSupabaseQuoteRepository(
  supabase: SupabaseClient<Database>,
): QuoteRepository {
  return {
    async findById(quoteId) {
      const { data, error } = await supabase
        .from("quotes")
        .select(quoteFields)
        .eq("id", quoteId)
        .is("archived_at", null)
        .limit(1)
        .maybeSingle();

      if (error) {
        throw new DependencyUnavailableError("Quotes are temporarily unavailable.");
      }

      return data;
    },
    async findByGuide(guideId) {
      const result = await supabase
        .from("quotes")
        .select(quoteFields)
        .eq("guide_id", guideId)
        .is("archived_at", null)
        .order("id", { ascending: true })
        .limit(guideFallbackLimit);

      return ensureQuerySucceeded(result);
    },
    async findByMoodTag(guideId, moodLabel) {
      const result = await supabase
        .from("quotes")
        .select(quoteFields)
        .eq("guide_id", guideId)
        .is("archived_at", null)
        .overlaps("mood_tags", [moodLabel])
        .limit(candidateLimitPerFilter);

      return ensureQuerySucceeded(result);
    },
    async findByTheme(guideId, theme) {
      const result = await supabase
        .from("quotes")
        .select(quoteFields)
        .eq("guide_id", guideId)
        .is("archived_at", null)
        .overlaps("themes", [theme])
        .limit(candidateLimitPerFilter);

      return ensureQuerySucceeded(result);
    },
    async list(limit) {
      const result = await supabase
        .from("quotes")
        .select(quoteFields)
        .is("archived_at", null)
        .order("id", { ascending: true })
        .limit(limit);

      return ensureQuerySucceeded(result);
    },
  };
}

function mergeCandidates(candidateGroups: PublicQuote[][]): PublicQuote[] {
  const candidates = new Map<string, PublicQuote>();
  for (const group of candidateGroups) {
    for (const quote of group) candidates.set(quote.id, quote);
  }
  return [...candidates.values()];
}

function excludeWhenPossible(
  candidates: PublicQuote[],
  excludedQuoteId?: string,
): PublicQuote[] {
  if (!excludedQuoteId || candidates.length <= 1) return candidates;

  const filtered = candidates.filter((quote) => quote.id !== excludedQuoteId);
  return filtered.length > 0 ? filtered : candidates;
}

function scoreQuote(quote: PublicQuote, input: QuoteMatchInput): number {
  let score = 0;
  if (input.theme && quote.themes.includes(input.theme)) score += 1;
  if (input.moodLabel && quote.mood_tags.includes(input.moodLabel)) score += 2;
  return score;
}

function pickEqualScoreCandidate(
  candidates: PublicQuote[],
  input: QuoteMatchInput,
  random: () => number,
): PublicQuote {
  const scored = candidates.map((quote) => ({
    quote,
    score: scoreQuote(quote, input),
  }));
  const bestScore = Math.max(...scored.map((candidate) => candidate.score));
  const best = scored.filter((candidate) => candidate.score === bestScore);
  const randomValue = Math.max(0, Math.min(0.999_999_999, random()));
  return best[Math.floor(randomValue * best.length)]!.quote;
}

export function createQuoteMatchingService({
  guides,
  random = Math.random,
  repository,
}: {
  guides: GuidesService;
  random?: () => number;
  repository: QuoteRepository;
}): QuoteMatchingService {
  return {
    async findMatch(guideId, quoteId) {
      const [guide, quote] = await Promise.all([
        guides.findById(guideId),
        repository.findById(quoteId),
      ]);
      if (!guide || !quote || quote.guide_id !== guide.id) return null;
      return { guide, quote };
    },
    async match(input) {
      const guide = await guides.findBySlug(input.guideSlug);
      if (!guide) throw new ResourceNotFoundError("Guide not found.");

      const filteredQueries: Array<Promise<PublicQuote[]>> = [];
      if (input.theme) {
        filteredQueries.push(repository.findByTheme(guide.id, input.theme));
      }
      if (input.moodLabel) {
        filteredQueries.push(repository.findByMoodTag(guide.id, input.moodLabel));
      }

      const matchedCandidates = excludeWhenPossible(
        mergeCandidates(await Promise.all(filteredQueries)),
        input.excludedQuoteId,
      );
      if (matchedCandidates.length > 0) {
        return {
          guide,
          quote: pickEqualScoreCandidate(matchedCandidates, input, random),
        };
      }

      const fallbackCandidates = excludeWhenPossible(
        await repository.findByGuide(guide.id),
        input.excludedQuoteId,
      );
      if (fallbackCandidates.length === 0) {
        throw new ResourceNotFoundError("No quote is available for this guide.");
      }

      return {
        guide,
        quote: pickEqualScoreCandidate(fallbackCandidates, input, random),
      };
    },
    async wisdom(limit) {
      const quotes = await repository.list(limit);
      const guideIds = [...new Set(quotes.map((quote) => quote.guide_id))];
      const guidesById = new Map(
        (await Promise.all(guideIds.map((id) => guides.findById(id))))
          .filter((guide): guide is PublicGuide => guide !== null)
          .map((guide) => [guide.id, guide]),
      );

      return quotes.flatMap((quote) => {
        const guide = guidesById.get(quote.guide_id);
        return guide ? [{ guide, quote }] : [];
      });
    },
  };
}
