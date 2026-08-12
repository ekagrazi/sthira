import { z } from "zod";
import { describe, expect, it, vi } from "vitest";

import { createLlmGateway } from "./llm.js";

function completion(content = "steady response") {
  return new Response(
    JSON.stringify({ choices: [{ finish_reason: "stop", message: { content } }] }),
    { status: 200 },
  );
}

function gateway(fetchImplementation: typeof fetch) {
  return createLlmGateway({
    fetchImplementation,
    groq: { apiKey: "groq-test-key", model: "openai/gpt-oss-20b" },
    openRouter: {
      apiKey: "openrouter-test-key",
      model: "openai/gpt-oss-20b:free",
    },
    timeoutMs: 1_000,
  });
}

const request = {
  messages: [{ content: "Help me reflect.", role: "user" as const }],
};

describe("language provider resilience", () => {
  it("uses Groq for a successful primary call", async () => {
    const fetchImplementation = vi.fn<typeof fetch>().mockResolvedValue(completion());

    await expect(gateway(fetchImplementation).complete(request)).resolves.toEqual({
      content: "steady response",
      provider: "groq",
    });
    expect(fetchImplementation).toHaveBeenCalledOnce();
  });

  it("falls back once when the primary provider is unavailable", async () => {
    const fetchImplementation = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            error: { code: 503, metadata: { error_type: "provider_unavailable" } },
          }),
          { status: 503 },
        ),
      )
      .mockResolvedValueOnce(completion("fallback response"));

    await expect(gateway(fetchImplementation).complete(request)).resolves.toEqual({
      content: "fallback response",
      provider: "openrouter",
    });
    expect(fetchImplementation).toHaveBeenCalledTimes(2);
  });

  it("does not bypass a provider content-policy refusal", async () => {
    const fetchImplementation = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          error: {
            code: 403,
            metadata: { error_type: "content_policy_violation" },
          },
        }),
        { status: 403 },
      ),
    );

    await expect(gateway(fetchImplementation).complete(request)).rejects.toMatchObject({
      kind: "content_policy",
      provider: "groq",
    });
    expect(fetchImplementation).toHaveBeenCalledOnce();
  });

  it("validates structured output and rejects an oversized prompt locally", async () => {
    const fetchImplementation = vi.fn<typeof fetch>().mockResolvedValue(
      completion(JSON.stringify({ sentiment: 0.2, theme: "calm" })),
    );
    const llm = gateway(fetchImplementation);
    const outputSchema = z.object({
      sentiment: z.number().min(-1).max(1),
      theme: z.enum(["calm", "purpose"]),
    });

    await expect(
      llm.completeJson(
        {
          ...request,
          responseFormat: {
            name: "mood_analysis",
            schema: {
              properties: {
                sentiment: { type: "number" },
                theme: { enum: ["calm", "purpose"], type: "string" },
              },
              required: ["sentiment", "theme"],
              type: "object",
            },
          },
        },
        outputSchema,
      ),
    ).resolves.toEqual({
      data: { sentiment: 0.2, theme: "calm" },
      provider: "groq",
    });

    const callsBeforeOversizedPrompt = fetchImplementation.mock.calls.length;
    await expect(
      llm.complete({
        messages: Array.from({ length: 4 }, () => ({
          content: "x".repeat(3_500),
          role: "user" as const,
        })),
      }),
    ).rejects.toThrow("Invalid language-service request.");
    expect(fetchImplementation).toHaveBeenCalledTimes(callsBeforeOversizedPrompt);
  });
});
