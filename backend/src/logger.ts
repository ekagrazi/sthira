import pino from "pino";

export const loggerOptions: pino.LoggerOptions = {
  base: null,
  level:
    process.env.NODE_ENV === "test"
      ? "silent"
      : (process.env.LOG_LEVEL ?? "info"),
  redact: {
    censor: "[Redacted]",
    paths: [
      "authorization",
      "token",
      "access_token",
      "refresh_token",
      "apiKey",
      "api_key",
      "SUPABASE_SECRET_KEY",
      "GROQ_API_KEY",
      "OPENROUTER_API_KEY",
      "content",
      "free_text",
      "personal_note",
      "system_prompt",
      "req.headers.authorization",
      "req.headers.cookie",
      "req.body",
      "res.headers['set-cookie']",
      "headers.authorization",
      "headers.cookie",
    ],
  },
};

export const logger = pino(loggerOptions);
