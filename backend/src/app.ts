import express from "express";
import helmet from "helmet";

import { logger } from "./logger.js";
import { createCorsMiddleware } from "./middleware/cors.js";
import { errorHandler, notFoundHandler } from "./middleware/errors.js";
import { createHttpLoggingMiddleware } from "./middleware/http-logging.js";
import { createRateLimitMiddleware } from "./middleware/rate-limit.js";
import {
  createAuthenticationMiddleware,
  type AccessTokenVerifier,
} from "./middleware/authenticate.js";
import { createChatRouter } from "./routes/chat.js";
import { createGuidesRouter } from "./routes/guides.js";
import { createInsightsRouter } from "./routes/insights.js";
import { createJournalRouter } from "./routes/journal.js";
import { createLibraryRouter } from "./routes/library.js";
import { createMoodRouter } from "./routes/mood.js";
import { createStreakRouter } from "./routes/streak.js";
import { createWisdomRouter } from "./routes/wisdom.js";
import type { ChatSessionsService } from "./services/chat-sessions.js";
import type { GuidesService } from "./services/guides.js";
import type { InsightsService } from "./services/insights.js";
import type { JournalService } from "./services/journal.js";
import type { LibraryService } from "./services/library.js";
import type { MoodService } from "./services/mood.js";
import type { QuoteMatchingService } from "./services/quote-matching.js";
import type { StreakSummaryService } from "./services/streaks.js";
import { DependencyUnavailableError } from "./errors/app-error.js";
import type { HealthResponse } from "./types/api.js";

export type AppDependencies = {
  allowedOrigins: readonly string[];
  chat: ChatSessionsService;
  guides: GuidesService;
  insights: InsightsService;
  journal: JournalService;
  library: LibraryService;
  mood: MoodService;
  quotes: QuoteMatchingService;
  streaks: StreakSummaryService;
  verifyAccessToken: AccessTokenVerifier;
  llmRateLimit?: {
    ipRequests: number;
    userRequests: number;
    windowMs: number;
  };
};

const rejectAllTokens: AccessTokenVerifier = () => Promise.resolve(null);
const emptyGuides: GuidesService = {
  findById: () => Promise.resolve(null),
  findBySlug: () => Promise.resolve(null),
  list: () => Promise.resolve([]),
};
const unavailableMood: MoodService = {
  checkIn: () =>
    Promise.reject(new DependencyUnavailableError("Mood service unavailable.")),
  history: () =>
    Promise.reject(new DependencyUnavailableError("Mood service unavailable.")),
  getResult: () =>
    Promise.reject(new DependencyUnavailableError("Mood service unavailable.")),
  reroll: () =>
    Promise.reject(new DependencyUnavailableError("Mood service unavailable.")),
};
const unavailable = () =>
  Promise.reject(new DependencyUnavailableError("Service unavailable."));
const unavailableChat: ChatSessionsService = {
  create: unavailable,
  get: unavailable,
  list: unavailable,
  listMessages: unavailable,
  submitMessage: unavailable,
};
const unavailableJournal: JournalService = {
  create: unavailable,
  delete: unavailable,
  list: unavailable,
  update: unavailable,
};
const unavailableLibrary: LibraryService = { list: unavailable };
const unavailableInsights: InsightsService = { get: unavailable };
const unavailableQuotes: QuoteMatchingService = {
  findMatch: unavailable,
  match: unavailable,
  wisdom: unavailable,
};
const unavailableStreaks: StreakSummaryService = { get: unavailable };
const defaultDependencies: AppDependencies = {
  allowedOrigins: ["http://localhost:3000"],
  chat: unavailableChat,
  guides: emptyGuides,
  insights: unavailableInsights,
  journal: unavailableJournal,
  library: unavailableLibrary,
  mood: unavailableMood,
  quotes: unavailableQuotes,
  streaks: unavailableStreaks,
  verifyAccessToken: rejectAllTokens,
};

export function createApp(
  overrides: Partial<AppDependencies> = {},
) {
  const dependencies: AppDependencies = {
    ...defaultDependencies,
    ...overrides,
  };
  const app = express();
  const llmRateLimit = dependencies.llmRateLimit ?? {
    ipRequests: 20,
    userRequests: 10,
    windowMs: 60_000,
  };

  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use(createHttpLoggingMiddleware(logger));
  app.use(helmet());
  app.use(createCorsMiddleware(dependencies.allowedOrigins));

  app.get("/api/health", (_request, response) => {
    const body: HealthResponse = { status: "ok" };
    response.setHeader("Cache-Control", "no-store");
    response.status(200).json(body);
  });

  app.use("/api/guides", createGuidesRouter(dependencies.guides));

  const authenticate = createAuthenticationMiddleware(
    dependencies.verifyAccessToken,
  );
  app.use("/api", authenticate);
  app.use("/api", (_request, response, next) => {
    response.setHeader("Cache-Control", "private, no-store");
    response.setHeader("Pragma", "no-cache");
    response.vary("Authorization");
    next();
  });
  app.use(express.json({ limit: "16kb" }));

  const perIpLlmLimit = createRateLimitMiddleware({
    key: (request) => request.ip ?? request.socket.remoteAddress ?? null,
    maxRequests: llmRateLimit.ipRequests,
    windowMs: llmRateLimit.windowMs,
  });
  const perUserLlmLimit = createRateLimitMiddleware({
    key: (request) => request.auth?.userId ?? null,
    maxRequests: llmRateLimit.userRequests,
    windowMs: llmRateLimit.windowMs,
  });
  app.use("/api/mood/checkin", perIpLlmLimit, perUserLlmLimit);
  app.use("/api/chat/sessions/:id/messages", perIpLlmLimit, perUserLlmLimit);

  app.use("/api/mood", createMoodRouter(dependencies.mood));
  app.use("/api/journal", createJournalRouter(dependencies.journal));
  app.use("/api/library", createLibraryRouter(dependencies.library));
  app.use("/api/chat", createChatRouter(dependencies.chat));
  app.use("/api/wisdom", createWisdomRouter(dependencies.quotes));
  app.use("/api/streak", createStreakRouter(dependencies.streaks));
  app.use("/api/insights", createInsightsRouter(dependencies.insights));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export const app = createApp();
