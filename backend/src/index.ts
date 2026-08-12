import "dotenv/config";

import { createApp } from "./app.js";
import { loadBackendEnv } from "./config/env.js";
import { logger } from "./logger.js";
import { createSupabaseGuidesService } from "./services/guides.js";
import { createSupabaseChatSessionsService } from "./services/chat-sessions.js";
import { createSupabaseJournalService } from "./services/journal.js";
import { createSupabaseLibraryService } from "./services/library.js";
import { createSupabaseInsightsService } from "./services/insights.js";
import { createLlmGateway } from "./services/llm.js";
import { createSupabaseMoodCheckinsService } from "./services/mood-checkins.js";
import { createMoodService } from "./services/mood.js";
import {
  createQuoteMatchingService,
  createSupabaseQuoteRepository,
} from "./services/quote-matching.js";
import { createMoodAnalysisService } from "./services/sentiment-analysis.js";
import { createSupabaseStreakSummaryService } from "./services/streaks.js";
import {
  createSupabaseAdminClient,
  createSupabaseTokenVerifier,
} from "./services/supabase.js";

const env = loadBackendEnv();
const supabase = createSupabaseAdminClient(env);
const guides = createSupabaseGuidesService(supabase);
const llm = createLlmGateway({
  ...(env.groqApiKey && {
    groq: { apiKey: env.groqApiKey, model: env.groqModel },
  }),
  ...(env.openRouterApiKey && {
    openRouter: { apiKey: env.openRouterApiKey, model: env.openRouterModel },
  }),
  timeoutMs: env.llmTimeoutMs,
});
const quotes = createQuoteMatchingService({
  guides,
  repository: createSupabaseQuoteRepository(supabase),
});
const mood = createMoodService({
  analysis: createMoodAnalysisService(llm),
  checkins: createSupabaseMoodCheckinsService(supabase),
  quotes,
});
const app = createApp({
  allowedOrigins: env.frontendOrigins,
  chat: createSupabaseChatSessionsService(supabase, guides, llm),
  guides,
  insights: createSupabaseInsightsService(supabase),
  journal: createSupabaseJournalService(supabase),
  library: createSupabaseLibraryService(supabase, guides),
  mood,
  quotes,
  streaks: createSupabaseStreakSummaryService(supabase),
  verifyAccessToken: createSupabaseTokenVerifier(supabase),
});

const server = app.listen(env.port, "0.0.0.0", () => {
  logger.info({ port: env.port }, "API listening");
});

server.on("error", (error) => {
  logger.error({ error }, "API server error");
  process.exitCode = 1;
});

let shutdownStarted = false;

function shutdown(signal: NodeJS.Signals): void {
  if (shutdownStarted) {
    return;
  }

  shutdownStarted = true;
  logger.info({ signal }, "Shutting down API");

  const forceExitTimer = setTimeout(() => {
    logger.error("Graceful shutdown timed out");
    process.exit(1);
  }, 10_000);
  forceExitTimer.unref();

  server.close((error) => {
    clearTimeout(forceExitTimer);

    if (error) {
      logger.error({ error }, "API shutdown failed");
      process.exitCode = 1;
    }
  });
}

process.once("SIGTERM", () => shutdown("SIGTERM"));
process.once("SIGINT", () => shutdown("SIGINT"));
