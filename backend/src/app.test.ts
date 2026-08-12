import pino from "pino";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";

import { createApp } from "./app.js";
import { loadBackendEnv } from "./config/env.js";
import { loggerOptions } from "./logger.js";
import type { GuidesService } from "./services/guides.js";
import type { MoodService } from "./services/mood.js";

const guide = {
  accent_color: "#334455",
  icon: "scale",
  id: "11111111-1111-4111-8111-111111111111",
  name: "Marcus Aurelius",
  short_desc: "A practical perspective.",
  slug: "marcus-aurelius" as const,
  tradition: "Stoicism",
};

const guides: GuidesService = {
  findById: () => Promise.resolve(guide),
  findBySlug: () => Promise.resolve(guide),
  list: () => Promise.resolve([guide]),
};

function moodService(): MoodService {
  const quote = {
    citation: "Meditations 4.3",
    guide_id: guide.id,
    id: "22222222-2222-4222-8222-222222222222",
    mood_tags: ["anxious"],
    text: "Retire into yourself.",
    themes: ["peace"],
  };
  const checkin = {
    created_at: "2026-08-12T00:00:00.000Z",
    detected_theme: "peace",
    id: "33333333-3333-4333-8333-333333333333",
    matched_guide_id: guide.id,
    matched_quote_id: quote.id,
    mood_emoji: null,
    mood_label: "anxious",
    sentiment_score: -0.4,
  };
  const result = { checkin, matched_guide: guide, matched_quote: quote };

  return {
    checkIn: () => Promise.resolve(result),
    getResult: () => Promise.resolve(result),
    history: () => Promise.resolve({ history: [checkin], next_cursor: null }),
    reroll: () => Promise.resolve({ matched_guide: guide, matched_quote: quote }),
  };
}

describe("production API boundaries", () => {
  it("keeps health independent, non-cacheable, and security-header protected", async () => {
    const verifier = vi.fn(() => Promise.resolve("user-id"));
    const response = await request(createApp({ verifyAccessToken: verifier }))
      .get("/api/health")
      .set("X-Request-Id", "trace_id_12345678")
      .expect(200);

    expect(response.body).toEqual({ status: "ok" });
    expect(response.headers["cache-control"]).toBe("no-store");
    expect(response.headers["x-content-type-options"]).toBe("nosniff");
    expect(response.headers["x-request-id"]).toBe("trace_id_12345678");
    expect(verifier).not.toHaveBeenCalled();
  });

  it("exposes only public guide fields to an approved browser origin", async () => {
    const app = createApp({
      allowedOrigins: ["https://sthira.example"],
      guides,
    });
    const allowed = await request(app)
      .get("/api/guides")
      .set("Origin", "https://sthira.example")
      .expect(200);
    const rejected = await request(app)
      .get("/api/guides")
      .set("Origin", "https://attacker.example")
      .expect(403);

    expect(allowed.headers["access-control-allow-origin"]).toBe(
      "https://sthira.example",
    );
    expect(JSON.stringify(allowed.body)).not.toContain("system_prompt");
    expect(rejected.body).toEqual({ error: "Origin not allowed." });
  });

  it("rejects every private resource without a bearer token", async () => {
    const app = createApp();
    const paths = [
      "/api/mood/history",
      "/api/journal",
      "/api/library",
      "/api/chat/sessions",
      "/api/wisdom",
      "/api/streak",
      "/api/insights",
    ];

    for (const path of paths) {
      const response = await request(app).get(path).expect(401);
      expect(response.body).toEqual({ error: "Unauthorized" });
    }
  });

  it("verifies the token before protected routing and disables shared caching", async () => {
    const verifier = vi.fn(() => Promise.resolve("verified-user"));
    const response = await request(createApp({ verifyAccessToken: verifier }))
      .get("/api/private")
      .set("Authorization", "Bearer valid-token")
      .expect(404);

    expect(verifier).toHaveBeenCalledWith("valid-token");
    expect(response.headers["cache-control"]).toBe("private, no-store");
    expect(response.headers["pragma"]).toBe("no-cache");
    expect(response.headers["vary"]).toContain("Authorization");
  });

  it("rate-limits repeated language-backed requests", async () => {
    const app = createApp({
      llmRateLimit: { ipRequests: 10, userRequests: 1, windowMs: 60_000 },
      mood: moodService(),
      verifyAccessToken: () => Promise.resolve("verified-user"),
    });
    const send = () =>
      request(app)
        .post("/api/mood/checkin")
        .set("Authorization", "Bearer valid-token")
        .send({ free_text: "I feel unsettled." });

    await send().expect(201);
    const limited = await send().expect(429);
    expect(limited.body).toEqual({ error: "Too many requests." });
    expect(limited.headers["retry-after"]).toBeDefined();
  });

  it("rejects oversized JSON before protected route handling", async () => {
    const response = await request(
      createApp({ verifyAccessToken: () => Promise.resolve("verified-user") }),
    )
      .post("/api/private")
      .set("Authorization", "Bearer valid-token")
      .send({ content: "x".repeat(17_000) })
      .expect(413);

    expect(response.body).toEqual({ error: "Request body too large." });
  });

  it("allows only the configured frontend origin in production", () => {
    const env = loadBackendEnv({
      FRONTEND_URL: "https://sthira.example/path",
      NODE_ENV: "production",
      SUPABASE_SECRET_KEY: "test-secret-key-at-least-twenty-characters",
      SUPABASE_URL: "https://project.supabase.co",
    });

    expect(env.frontendOrigins).toEqual(["https://sthira.example"]);
  });

  it("redacts credentials and private request text from structured logs", () => {
    let output = "";
    const destination = { write: (chunk: string) => (output += chunk) };
    const testLogger = pino({ ...loggerOptions, level: "info" }, destination);

    testLogger.info({
      apiKey: "highly-sensitive-api-key",
      req: {
        body: { content: "private reflection" },
        headers: { authorization: "Bearer sensitive-token" },
      },
    });

    expect(output).not.toContain("highly-sensitive-api-key");
    expect(output).not.toContain("private reflection");
    expect(output).not.toContain("sensitive-token");
    expect(output).toContain("[Redacted]");
  });
});
