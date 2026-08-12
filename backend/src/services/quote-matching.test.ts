import { describe, expect, it, vi } from "vitest";

import type { PublicGuide, PublicQuote } from "../types/api.js";
import {
  createQuoteMatchingService,
  createSupabaseQuoteRepository,
  type QuoteRepository,
} from "./quote-matching.js";

const guide: PublicGuide = {
  accent_color: "#112233",
  icon: "leaf",
  id: "11111111-1111-4111-8111-111111111111",
  name: "Buddha",
  short_desc: "Description",
  slug: "buddha",
  tradition: "Dhammapada",
};

function quote(id: string, themes: string[], moodTags: string[]): PublicQuote {
  return {
    citation: "Dhammapada 1",
    guide_id: guide.id,
    id,
    mood_tags: moodTags,
    text: `Passage ${id}`,
    themes,
  };
}

describe("bounded passage matching", () => {
  it("prefers a passage matching both mood and theme", async () => {
    const themeOnly = quote("theme", ["peace"], []);
    const moodOnly = quote("mood", [], ["anxious"]);
    const both = quote("both", ["peace"], ["anxious"]);
    const repository: QuoteRepository = {
      findByGuide: vi.fn(() => Promise.resolve([])),
      findById: vi.fn(() => Promise.resolve(null)),
      findByMoodTag: vi.fn(() => Promise.resolve([moodOnly, both])),
      findByTheme: vi.fn(() => Promise.resolve([themeOnly, both])),
      list: vi.fn(() => Promise.resolve([])),
    };
    const guides = {
      findById: vi.fn(() => Promise.resolve(guide)),
      findBySlug: vi.fn(() => Promise.resolve(guide)),
      list: vi.fn(() => Promise.resolve([guide])),
    };
    const matcher = createQuoteMatchingService({ guides, repository });

    await expect(
      matcher.match({ guideSlug: "buddha", moodLabel: "anxious", theme: "peace" }),
    ).resolves.toEqual({ guide, quote: both });
  });

  it("queries only active indexed candidates with a hard limit", async () => {
    const limit = vi.fn(() => Promise.resolve({ data: [], error: null }));
    const overlaps = vi.fn(() => ({ limit }));
    const is = vi.fn(() => ({ overlaps }));
    const eq = vi.fn(() => ({ is }));
    const select = vi.fn(() => ({ eq }));
    const supabase = { from: vi.fn(() => ({ select })) };
    const repository = createSupabaseQuoteRepository(supabase as never);

    await repository.findByTheme(guide.id, "peace");

    expect(eq).toHaveBeenCalledWith("guide_id", guide.id);
    expect(is).toHaveBeenCalledWith("archived_at", null);
    expect(overlaps).toHaveBeenCalledWith("themes", ["peace"]);
    expect(limit).toHaveBeenCalledWith(12);
  });
});
