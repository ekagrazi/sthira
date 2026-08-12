import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import {
  DependencyUnavailableError,
  RequestValidationError,
  ResourceNotFoundError,
} from "../errors/app-error.js";
import type { LibraryListQuery } from "../schemas/library.js";
import type { LibraryPassage, LibraryResponse, PublicGuide, PublicQuote } from "../types/api.js";
import type { Database } from "../types/database.js";
import type { GuidesService } from "./guides.js";

const quoteFields = "id, guide_id, text, citation, themes, mood_tags, content_type, source_work, source_url, translator, rights_basis" as const;

const cursorSchema = z.object({
  offsets: z.array(z.number().int().min(0)).min(1).max(20),
});

export interface LibraryService {
  list(userId: string, query: LibraryListQuery): Promise<LibraryResponse>;
}

function unavailable(): DependencyUnavailableError {
  return new DependencyUnavailableError("The passage library is temporarily unavailable.");
}

function encodeCursor(offsets: number[]): string {
  return Buffer.from(JSON.stringify({ offsets }), "utf8").toString("base64url");
}

function decodeCursor(value: string, guideCount: number): number[] {
  try {
    const parsed = cursorSchema.safeParse(
      JSON.parse(Buffer.from(value, "base64url").toString("utf8")),
    );
    if (parsed.success && parsed.data.offsets.length === guideCount) {
      return parsed.data.offsets;
    }
  } catch {
    throw new RequestValidationError("Invalid library cursor.");
  }
  throw new RequestValidationError("Invalid library cursor.");
}

function escapeLike(value: string): string {
  return value.replace(/[\\_%]/gu, (character) => `\\${character}`);
}

function interleave(rowsByGuide: PublicQuote[][]): PublicQuote[] {
  const output: PublicQuote[] = [];
  const longest = Math.max(0, ...rowsByGuide.map((rows) => rows.length));
  for (let rowIndex = 0; rowIndex < longest; rowIndex += 1) {
    for (const rows of rowsByGuide) {
      const row = rows[rowIndex];
      if (row) output.push(row);
    }
  }
  return output;
}

export function createSupabaseLibraryService(
  supabase: SupabaseClient<Database>,
  guides: GuidesService,
): LibraryService {
  return {
    async list(userId, query) {
      const requestedGuide = query.guide_slug
        ? await guides.findBySlug(query.guide_slug)
        : null;
      if (query.guide_slug && !requestedGuide) {
        throw new ResourceNotFoundError("Perspective not found.");
      }

      const availableGuides = requestedGuide ? [requestedGuide] : await guides.list();
      if (availableGuides.length === 0) return { next_cursor: null, passages: [] };

      const offsets = query.cursor
        ? decodeCursor(query.cursor, availableGuides.length)
        : availableGuides.map(() => 0);
      const baseQuota = Math.floor(query.limit / availableGuides.length);
      const extra = query.limit % availableGuides.length;
      const quotas = availableGuides.map((_, index) => baseQuota + (index < extra ? 1 : 0));

      const pageResults = await Promise.all(
        availableGuides.map(async (guide, index) => {
          const quota = quotas[index] ?? 0;
          if (quota === 0) return { data: [] as PublicQuote[], hasMore: false };
          let request = supabase
            .from("quotes")
            .select(quoteFields)
            .eq("guide_id", guide.id)
            .is("archived_at", null)
            .order("created_at", { ascending: false })
            .order("id", { ascending: false })
            .range(offsets[index] ?? 0, (offsets[index] ?? 0) + quota);
          if (query.theme) request = request.contains("themes", [query.theme]);
          if (query.query) request = request.ilike("text", `%${escapeLike(query.query)}%`);
          const { data, error } = await request;
          if (error || !data) throw unavailable();
          return {
            data: data.slice(0, quota),
            hasMore: data.length > quota,
          };
        }),
      );

      const rowsByGuide = pageResults.map((result) => result.data);
      const rows = interleave(rowsByGuide);
      const quoteIds = rows.map((row) => row.id);
      const savedResult = quoteIds.length > 0
        ? await supabase
            .from("journal_entries")
            .select("id, quote_id")
            .eq("user_id", userId)
            .in("quote_id", quoteIds)
        : { data: [], error: null };
      if (savedResult.error || !savedResult.data) throw unavailable();

      const guidesById = new Map<string, PublicGuide>(
        availableGuides.map((guide) => [guide.id, guide]),
      );
      const savedByQuote = new Map(
        savedResult.data.map((entry) => [entry.quote_id, entry.id]),
      );
      const passages: LibraryPassage[] = rows.flatMap((row) => {
        const passageGuide = guidesById.get(row.guide_id);
        if (!passageGuide) return [];
        return [{
          guide: passageGuide,
          journal_entry_id: savedByQuote.get(row.id) ?? null,
          quote: row,
        }];
      });

      const hasMore = pageResults.some((result) => result.hasMore);
      const nextOffsets = offsets.map(
        (offset, index) => offset + (pageResults[index]?.data.length ?? 0),
      );
      return {
        next_cursor: hasMore ? encodeCursor(nextOffsets) : null,
        passages,
      };
    },
  };
}
