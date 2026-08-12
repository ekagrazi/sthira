import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import {
  DependencyUnavailableError,
  RequestValidationError,
  ResourceNotFoundError,
} from "../errors/app-error.js";
import type {
  JournalCreateBody,
  JournalListQuery,
  JournalUpdateBody,
} from "../schemas/journal.js";
import type {
  JournalEntrySummary,
  JournalListResponse,
} from "../types/api.js";
import type { Database } from "../types/database.js";

const journalFields =
  "id, checkin_id, quote_id, personal_note, tags, created_at" as const;
const quoteFields = "id, guide_id, text, citation, content_type, source_work, translator" as const;
const guideFields = "id, name, accent_color" as const;

type JournalRow = {
  checkin_id: string | null;
  created_at: string;
  id: string;
  personal_note: string | null;
  quote_id: string;
  tags: string[];
};

const cursorSchema = z.object({
  created_at: z.iso.datetime({ offset: true }),
  id: z.uuid(),
});

export type JournalCreateResult = {
  created: boolean;
  entry: JournalEntrySummary;
};

export interface JournalService {
  create(userId: string, input: JournalCreateBody): Promise<JournalCreateResult>;
  delete(userId: string, entryId: string): Promise<void>;
  list(userId: string, query: JournalListQuery): Promise<JournalListResponse>;
  update(
    userId: string,
    entryId: string,
    input: JournalUpdateBody,
  ): Promise<JournalEntrySummary>;
}

function unavailable(): DependencyUnavailableError {
  return new DependencyUnavailableError("Journal entries are temporarily unavailable.");
}

function isUniqueViolation(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: unknown }).code === "23505",
  );
}

function normalizeTags(tags: string[] | undefined): string[] | undefined {
  return tags
    ? [...new Set(tags.map((tag) => tag.trim().toLocaleLowerCase("en")))]
    : undefined;
}

export function encodeJournalCursor(row: Pick<JournalRow, "created_at" | "id">): string {
  return Buffer.from(JSON.stringify(row), "utf8").toString("base64url");
}

export function decodeJournalCursor(value: string): {
  created_at: string;
  id: string;
} {
  try {
    const parsed = cursorSchema.safeParse(
      JSON.parse(Buffer.from(value, "base64url").toString("utf8")),
    );
    if (parsed.success) return parsed.data;
  } catch {
    throw new RequestValidationError("Invalid journal cursor.");
  }
  throw new RequestValidationError("Invalid journal cursor.");
}

async function hydrateEntries(
  supabase: SupabaseClient<Database>,
  rows: JournalRow[],
): Promise<JournalEntrySummary[]> {
  if (rows.length === 0) return [];

  const quoteResult = await supabase
    .from("quotes")
    .select(quoteFields)
    .in("id", [...new Set(rows.map((row) => row.quote_id))]);
  if (quoteResult.error || !quoteResult.data) throw unavailable();

  const quotes = quoteResult.data;
  const guideResult = await supabase
    .from("guides")
    .select(guideFields)
    .in("id", [...new Set(quotes.map((quote) => quote.guide_id))]);
  if (guideResult.error || !guideResult.data) throw unavailable();

  const quotesById = new Map(quotes.map((quote) => [quote.id, quote]));
  const guidesById = new Map(
    guideResult.data.map((guide) => [guide.id, guide]),
  );

  return rows.flatMap((row) => {
    const quote = quotesById.get(row.quote_id);
    const guide = quote ? guidesById.get(quote.guide_id) : undefined;
    return quote && guide
      ? [{
          checkin_id: row.checkin_id,
          created_at: row.created_at,
          guide,
          id: row.id,
          personal_note: row.personal_note,
          quote,
          tags: row.tags,
        }]
      : [];
  });
}

async function hydrateOne(
  supabase: SupabaseClient<Database>,
  row: JournalRow,
): Promise<JournalEntrySummary> {
  const [entry] = await hydrateEntries(supabase, [row]);
  if (!entry) throw unavailable();
  return entry;
}

export function createSupabaseJournalService(
  supabase: SupabaseClient<Database>,
): JournalService {
  async function findExisting(
    userId: string,
    quoteId: string,
  ): Promise<JournalRow | null> {
    const { data, error } = await supabase
      .from("journal_entries")
      .select(journalFields)
      .eq("user_id", userId)
      .eq("quote_id", quoteId)
      .limit(1)
      .maybeSingle();
    if (error) throw unavailable();
    return data;
  }

  return {
    async create(userId, input) {
      if (input.checkin_id) {
        const checkinResult = await supabase
          .from("mood_checkins")
          .select("id, matched_quote_id")
          .eq("id", input.checkin_id)
          .eq("user_id", userId)
          .limit(1)
          .maybeSingle();
        if (checkinResult.error) throw unavailable();
        if (!checkinResult.data) {
          throw new ResourceNotFoundError("Mood check-in not found.");
        }
        if (checkinResult.data.matched_quote_id !== input.quote_id) {
          throw new RequestValidationError("Quote does not match the mood check-in.");
        }
      }

      const quoteResult = await supabase
        .from("quotes")
        .select("id")
        .eq("id", input.quote_id)
        .is("archived_at", null)
        .limit(1)
        .maybeSingle();
      if (quoteResult.error) throw unavailable();
      if (!quoteResult.data) throw new ResourceNotFoundError("Quote not found.");

      const { data, error } = await supabase
        .from("journal_entries")
        .insert({
          ...(input.checkin_id && { checkin_id: input.checkin_id }),
          ...(input.personal_note && { personal_note: input.personal_note }),
          quote_id: input.quote_id,
          ...(input.tags ? { tags: normalizeTags(input.tags)! } : {}),
          user_id: userId,
        })
        .select(journalFields)
        .single();
      if (!error && data) {
        return { created: true, entry: await hydrateOne(supabase, data) };
      }
      if (isUniqueViolation(error)) {
        const existing = await findExisting(userId, input.quote_id);
        if (existing) {
          return { created: false, entry: await hydrateOne(supabase, existing) };
        }
      }
      throw unavailable();
    },
    async delete(userId, entryId) {
      const { data, error } = await supabase
        .from("journal_entries")
        .delete()
        .eq("id", entryId)
        .eq("user_id", userId)
        .select("id")
        .limit(1)
        .maybeSingle();
      if (error) throw unavailable();
      if (!data) throw new ResourceNotFoundError("Journal entry not found.");
    },
    async list(userId, query) {
      let request = supabase
        .from("journal_entries")
        .select(journalFields)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(query.limit + 1);
      if (query.cursor) {
        const cursor = decodeJournalCursor(query.cursor);
        request = request.or(
          `created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`,
        );
      }

      const { data, error } = await request;
      if (error || !data) throw unavailable();

      const hasMore = data.length > query.limit;
      const rows = hasMore ? data.slice(0, query.limit) : data;
      return {
        entries: await hydrateEntries(supabase, rows),
        next_cursor: hasMore && rows.at(-1)
          ? encodeJournalCursor(rows.at(-1)!)
          : null,
      };
    },
    async update(userId, entryId, input) {
      const tags = normalizeTags(input.tags);
      const { data, error } = await supabase
        .from("journal_entries")
        .update({
          ...(input.personal_note !== undefined && {
            personal_note: input.personal_note || null,
          }),
          ...(tags && { tags }),
        })
        .eq("id", entryId)
        .eq("user_id", userId)
        .select(journalFields)
        .limit(1)
        .maybeSingle();
      if (error) throw unavailable();
      if (!data) throw new ResourceNotFoundError("Journal entry not found.");
      return hydrateOne(supabase, data);
    },
  };
}
