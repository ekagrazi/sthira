"use client";

import { getPublicBackendUrl } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";
import type {
  ChatSessionList,
  ChatSessionSummary,
  ChatMessageList,
  ChatTurn,
  GuideSlug,
  InsightsResponse,
  JournalEntrySummary,
  JournalList,
  LibraryResponse,
  MoodResult,
  MoodRerollResult,
  PublicGuide,
  StreakSummary,
  WisdomResponse,
} from "@/lib/api/types";

export type ApiErrorKind =
  | "authentication"
  | "cold-start"
  | "generic"
  | "rate-limit"
  | "timeout";

export class ApiClientError extends Error {
  constructor(
    message: string,
    readonly kind: ApiErrorKind,
    readonly status: number | null = null,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

const REQUEST_TIMEOUT_MS = 35_000;
const COLD_START_STATUSES = new Set([502, 503, 504]);

type RequestOptions = {
  body?: unknown;
  method?: "DELETE" | "GET" | "PATCH" | "POST";
  signal?: AbortSignal;
};

async function publicRequest<T>(path: string, signal?: AbortSignal): Promise<T> {
  return requestOnce<T>(path, null, { signal });
}

async function accessToken(): Promise<string> {
  const { data, error } = await createClient().auth.getSession();
  if (error || !data.session?.access_token) {
    throw new ApiClientError(
      "Your session has ended. Sign in again to continue.",
      "authentication",
      401,
    );
  }
  return data.session.access_token;
}

function controlledMessage(status: number, backendMessage?: string): ApiClientError {
  if (status === 401) {
    return new ApiClientError(
      "Your session has ended. Sign in again to continue.",
      "authentication",
      status,
    );
  }
  if (status === 429) {
    return new ApiClientError(
      "A few moments are needed before trying again.",
      "rate-limit",
      status,
    );
  }
  if (COLD_START_STATUSES.has(status)) {
    return new ApiClientError(
      "The reflection service is still waking up. Please try once more.",
      "cold-start",
      status,
    );
  }
  if (status === 404) {
    return new ApiClientError(backendMessage ?? "The requested item was not found.", "generic", status);
  }
  return new ApiClientError(
    status >= 500
      ? "The service could not complete that request. Please try again."
      : (backendMessage ?? "The request could not be completed."),
    "generic",
    status,
  );
}

async function responseError(response: Response): Promise<ApiClientError> {
  let backendMessage: string | undefined;
  try {
    const body = (await response.json()) as { error?: unknown };
    if (typeof body.error === "string") backendMessage = body.error;
  } catch {
    backendMessage = undefined;
  }
  return controlledMessage(response.status, backendMessage);
}

async function requestOnce<T>(
  path: string,
  token: string | null,
  options: RequestOptions,
): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort("timeout"), REQUEST_TIMEOUT_MS);
  const abortFromCaller = () => controller.abort(options.signal?.reason);
  options.signal?.addEventListener("abort", abortFromCaller, { once: true });

  try {
    const response = await fetch(`${getPublicBackendUrl()}${path}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      method: options.method ?? "GET",
      ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
      signal: controller.signal,
    });
    if (!response.ok) throw await responseError(response);
    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof ApiClientError) throw error;
    if (controller.signal.aborted) {
      if (options.signal?.aborted) throw error;
      throw new ApiClientError(
        "The service is taking longer than expected. Please try again.",
        "timeout",
      );
    }
    throw new ApiClientError(
      "The service could not be reached. Check your connection and try again.",
      "generic",
    );
  } finally {
    window.clearTimeout(timeout);
    options.signal?.removeEventListener("abort", abortFromCaller);
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const token = await accessToken();
  const isRead = (options.method ?? "GET") === "GET";
  const attempts = isRead ? 2 : 1;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await requestOnce<T>(path, token, options);
    } catch (error) {
      const retryable =
        error instanceof ApiClientError &&
        (error.kind === "cold-start" ||
          error.kind === "timeout" ||
          (error.kind === "generic" &&
            (error.status === null || error.status >= 500)));
      if (!isRead || !retryable || attempt === attempts - 1 || options.signal?.aborted) {
        throw error;
      }
    }
  }

  throw new ApiClientError("The request could not be completed.", "generic");
}

export const api = {
  chat: {
    createSession: (guideSlug: GuideSlug) =>
      apiRequest<ChatSessionSummary>("/api/chat/sessions", {
        body: { guide_slug: guideSlug },
        method: "POST",
      }),
    createCompanionSession: () =>
      apiRequest<ChatSessionSummary>("/api/chat/sessions", {
        body: { mode: "companion" },
        method: "POST",
      }),
    listSessions: (
      limit = 1,
      signal?: AbortSignal,
      mode?: "companion" | "guide",
    ) =>
      apiRequest<ChatSessionList>(
        `/api/chat/sessions?limit=${limit}${mode ? `&mode=${mode}` : ""}`,
        { signal },
      ),
    getSession: (sessionId: string, signal?: AbortSignal) =>
      apiRequest<ChatSessionSummary>(
        `/api/chat/sessions/${encodeURIComponent(sessionId)}`,
        { signal },
      ),
    listMessages: (sessionId: string, limit = 30, signal?: AbortSignal) =>
      apiRequest<ChatMessageList>(
        `/api/chat/sessions/${encodeURIComponent(sessionId)}/messages?limit=${limit}`,
        { signal },
      ),
    submitMessage: (
      sessionId: string,
      input: { client_action_id: string; content: string },
    ) =>
      apiRequest<ChatTurn>(
        `/api/chat/sessions/${encodeURIComponent(sessionId)}/messages`,
        { body: input, method: "POST" },
      ),
  },
  guides: {
    get: (slug: GuideSlug, signal?: AbortSignal) =>
      publicRequest<PublicGuide>(`/api/guides/${encodeURIComponent(slug)}`, signal),
    list: (signal?: AbortSignal) => publicRequest<PublicGuide[]>("/api/guides", signal),
  },
  journal: {
    create: (input: {
      checkin_id?: string;
      personal_note?: string;
      quote_id: string;
      tags?: string[];
    }) =>
      apiRequest<JournalEntrySummary>("/api/journal", { body: input, method: "POST" }),
    delete: (entryId: string) =>
      apiRequest<void>(`/api/journal/${encodeURIComponent(entryId)}`, {
        method: "DELETE",
      }),
    list: (limit = 10, cursor?: string, signal?: AbortSignal) =>
      apiRequest<JournalList>(
        `/api/journal?limit=${limit}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`,
        { signal },
      ),
    update: (
      entryId: string,
      input: { personal_note?: string | null; tags?: string[] },
    ) =>
      apiRequest<JournalEntrySummary>(
        `/api/journal/${encodeURIComponent(entryId)}`,
        { body: input, method: "PATCH" },
      ),
  },
  insights: {
    get: (signal?: AbortSignal) =>
      apiRequest<InsightsResponse>("/api/insights", { signal }),
  },
  library: {
    list: (
      input: {
        cursor?: string;
        guide_slug?: GuideSlug;
        limit?: number;
        query?: string;
        theme?: string;
      } = {},
      signal?: AbortSignal,
    ) => {
      const parameters = new URLSearchParams();
      parameters.set("limit", String(input.limit ?? 12));
      if (input.cursor) parameters.set("cursor", input.cursor);
      if (input.guide_slug) parameters.set("guide_slug", input.guide_slug);
      if (input.query) parameters.set("query", input.query);
      if (input.theme) parameters.set("theme", input.theme);
      return apiRequest<LibraryResponse>(`/api/library?${parameters.toString()}`, { signal });
    },
  },
  mood: {
    checkIn: (input: { free_text?: string; mood_emoji?: string }) =>
      apiRequest<MoodResult>("/api/mood/checkin", { body: input, method: "POST" }),
    getResult: (checkinId: string, signal?: AbortSignal) =>
      apiRequest<MoodResult>(`/api/mood/checkins/${encodeURIComponent(checkinId)}`, { signal }),
    reroll: (checkinId: string, guideSlug: GuideSlug) =>
      apiRequest<MoodRerollResult>("/api/mood/reroll", {
        body: { checkin_id: checkinId, guide_slug: guideSlug },
        method: "POST",
      }),
  },
  streak: {
    get: (signal?: AbortSignal) => apiRequest<StreakSummary>("/api/streak", { signal }),
  },
  wisdom: {
    list: (limit = 3, signal?: AbortSignal) =>
      apiRequest<WisdomResponse>(`/api/wisdom?limit=${limit}`, { signal }),
    forGuide: (guideSlug: GuideSlug) =>
      apiRequest<WisdomResponse>(
        `/api/wisdom?guide_slug=${encodeURIComponent(guideSlug)}&limit=1`,
      ),
  },
};
