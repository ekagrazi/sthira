import { z } from "zod";

import {
  DependencyUnavailableError,
  RequestValidationError,
} from "../errors/app-error.js";

const MAX_HISTORY_MESSAGES = 12;
const MAX_MESSAGE_CHARACTERS = 4_000;
const MAX_PROMPT_CHARACTERS = 12_000;
const MAX_SCHEMA_CHARACTERS = 12_000;
const MAX_COMPLETION_CHARACTERS = 24_000;
const MAX_COMPLETION_TOKENS = 800;

const messageSchema = z.object({
  content: z.string().min(1).max(MAX_MESSAGE_CHARACTERS),
  role: z.enum(["system", "user", "assistant"]),
});

const completionRequestSchema = z
  .object({
    maxTokens: z.number().int().min(1).max(MAX_COMPLETION_TOKENS).default(400),
    messages: z.array(messageSchema).min(1).max(MAX_HISTORY_MESSAGES),
    responseFormat: z
      .object({
        name: z.string().regex(/^[A-Za-z][A-Za-z0-9_-]{0,63}$/u),
        schema: z.record(z.string(), z.unknown()),
        strict: z.boolean().default(true),
      })
      .optional(),
    temperature: z.number().min(0).max(2).default(0.4),
  })
  .superRefine((value, context) => {
    const promptCharacters = value.messages.reduce(
      (total, message) => total + message.content.length,
      0,
    );
    if (promptCharacters > MAX_PROMPT_CHARACTERS) {
      context.addIssue({
        code: "custom",
        message: "Prompt is too large.",
        path: ["messages"],
      });
    }

    if (
      value.responseFormat &&
      JSON.stringify(value.responseFormat.schema).length > MAX_SCHEMA_CHARACTERS
    ) {
      context.addIssue({
        code: "custom",
        message: "Response schema is too large.",
        path: ["responseFormat", "schema"],
      });
    }
  });

const completionResponseSchema = z.object({
  choices: z
    .array(
      z.object({
        finish_reason: z.string().nullable().optional(),
        message: z.object({
          content: z.unknown(),
        }),
      }),
    )
    .min(1),
});

const providerErrorSchema = z.object({
  error: z
    .object({
      code: z.union([z.number(), z.string()]).optional(),
      metadata: z
        .object({ error_type: z.string().optional() })
        .passthrough()
        .optional(),
    })
    .optional(),
});

export type LlmMessage = z.infer<typeof messageSchema>;

export type StructuredOutputDefinition = {
  name: string;
  schema: Record<string, unknown>;
  strict?: boolean;
};

export type ChatCompletionRequest = {
  maxTokens?: number;
  messages: LlmMessage[];
  responseFormat?: StructuredOutputDefinition;
  temperature?: number;
};

export type ChatCompletionResult = {
  content: string;
  provider: "groq" | "openrouter";
};

export type LlmFailureKind =
  | "authentication"
  | "content_policy"
  | "rate_limit"
  | "server"
  | "timeout"
  | "validation";

export class LlmGatewayError extends DependencyUnavailableError {
  readonly kind: LlmFailureKind;
  readonly provider: "groq" | "openrouter" | "unconfigured";

  constructor(
    provider: "groq" | "openrouter" | "unconfigured",
    kind: LlmFailureKind,
  ) {
    super("Language service temporarily unavailable.");
    this.name = "LlmGatewayError";
    this.provider = provider;
    this.kind = kind;
  }
}

export interface LlmGateway {
  complete(request: ChatCompletionRequest): Promise<ChatCompletionResult>;
  completeJson<T>(
    request: ChatCompletionRequest,
    outputSchema: z.ZodType<T>,
  ): Promise<{ data: T; provider: "groq" | "openrouter" }>;
}

type ProviderConfig = {
  apiKey: string;
  model: string;
};

export type LlmGatewayConfig = {
  fetchImplementation?: typeof fetch;
  groq?: ProviderConfig;
  openRouter?: ProviderConfig;
  timeoutMs: number;
};

function classifyFailure(status: number, errorType?: string): LlmFailureKind {
  if (status === 408 || errorType === "timeout") return "timeout";
  if (status === 429 || errorType === "rate_limit_exceeded") {
    return "rate_limit";
  }
  if (status >= 500 || errorType === "provider_unavailable") return "server";
  if (status === 401 || status === 402) return "authentication";
  if (status === 403 || errorType === "content_policy_violation") {
    return "content_policy";
  }
  return "validation";
}

function canTryFallback(error: unknown): boolean {
  return (
    error instanceof LlmGatewayError &&
    error.kind !== "content_policy"
  );
}

function errorDetails(value: unknown): {
  code?: number;
  errorType?: string;
} {
  const result = providerErrorSchema.safeParse(value);
  if (!result.success || !result.data.error) return {};

  const rawCode = result.data.error.code;
  const code = typeof rawCode === "number" ? rawCode : Number(rawCode);
  return {
    ...(Number.isFinite(code) && { code }),
    ...(result.data.error.metadata?.error_type && {
      errorType: result.data.error.metadata.error_type,
    }),
  };
}

async function callProvider(
  provider: "groq" | "openrouter",
  config: ProviderConfig,
  request: z.infer<typeof completionRequestSchema>,
  timeoutMs: number,
  fetchImplementation: typeof fetch,
): Promise<ChatCompletionResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  timeout.unref();

  const endpoint =
    provider === "openrouter"
      ? "https://openrouter.ai/api/v1/chat/completions"
      : "https://api.groq.com/openai/v1/chat/completions";

  const responseFormat = request.responseFormat
    ? {
        type: "json_schema",
        json_schema: {
          name: request.responseFormat.name,
          schema: request.responseFormat.schema,
          strict: request.responseFormat.strict,
        },
      }
    : undefined;

  try {
    const response = await fetchImplementation(endpoint, {
      body: JSON.stringify({
        max_tokens: request.maxTokens,
        messages: request.messages,
        model: config.model,
        ...(provider === "openrouter"
          ? { reasoning: { effort: "low" } }
          : { reasoning_effort: "low" }),
        ...(responseFormat && { response_format: responseFormat }),
        stream: false,
        temperature: request.temperature,
      }),
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      signal: controller.signal,
    });

    let responseBody: unknown;
    try {
      responseBody = await response.json();
    } catch {
      throw new LlmGatewayError(provider, "validation");
    }

    const details = errorDetails(responseBody);
    if (!response.ok || details.code) {
      throw new LlmGatewayError(
        provider,
        classifyFailure(details.code ?? response.status, details.errorType),
      );
    }

    const parsed = completionResponseSchema.safeParse(responseBody);
    if (!parsed.success) {
      throw new LlmGatewayError(provider, "validation");
    }

    const completion = parsed.data.choices[0]!;
    const content = completion.message.content;
    if (
      completion.finish_reason === "length" ||
      typeof content !== "string" ||
      content.trim().length === 0
    ) {
      // A provider can return HTTP 200 without a usable answer. Treat that as
      // provider unavailability so the single configured fallback is attempted.
      throw new LlmGatewayError(provider, "server");
    }
    if (content.length > MAX_COMPLETION_CHARACTERS) {
      throw new LlmGatewayError(provider, "validation");
    }

    return {
      content,
      provider,
    };
  } catch (error) {
    if (error instanceof LlmGatewayError) throw error;
    if (controller.signal.aborted) {
      throw new LlmGatewayError(provider, "timeout");
    }
    throw new LlmGatewayError(provider, "server");
  } finally {
    clearTimeout(timeout);
  }
}

export function createLlmGateway(config: LlmGatewayConfig): LlmGateway {
  const fetchImplementation = config.fetchImplementation ?? fetch;

  function decodeStructured<T>(
    completion: ChatCompletionResult,
    outputSchema: z.ZodType<T>,
  ): { data: T; provider: "groq" | "openrouter" } {
    let decoded: unknown;
    try {
      decoded = JSON.parse(completion.content);
    } catch {
      throw new LlmGatewayError(completion.provider, "validation");
    }

    const parsedOutput = outputSchema.safeParse(decoded);
    if (!parsedOutput.success) {
      throw new LlmGatewayError(completion.provider, "validation");
    }

    return { data: parsedOutput.data, provider: completion.provider };
  }

  async function complete(
    request: ChatCompletionRequest,
  ): Promise<ChatCompletionResult> {
    const parsedRequest = completionRequestSchema.safeParse(request);
    if (!parsedRequest.success) {
      throw new RequestValidationError("Invalid language-service request.");
    }

    const primary = config.groq
      ? { config: config.groq, provider: "groq" as const }
      : config.openRouter
        ? { config: config.openRouter, provider: "openrouter" as const }
        : null;
    if (!primary) {
      throw new LlmGatewayError("unconfigured", "authentication");
    }

    const fallback =
      primary.provider === "groq" && config.openRouter
        ? { config: config.openRouter, provider: "openrouter" as const }
        : null;

    try {
      return await callProvider(
        primary.provider,
        primary.config,
        parsedRequest.data,
        config.timeoutMs,
        fetchImplementation,
      );
    } catch (error) {
      if (!fallback || !canTryFallback(error)) throw error;
    }

    return callProvider(
      fallback.provider,
      fallback.config,
      parsedRequest.data,
      config.timeoutMs,
      fetchImplementation,
    );
  }

  return {
    complete,
    async completeJson<T>(
      request: ChatCompletionRequest,
      outputSchema: z.ZodType<T>,
    ) {
      if (!request.responseFormat) {
        throw new RequestValidationError("Structured output schema is required.");
      }

      const parsedRequest = completionRequestSchema.safeParse(request);
      if (!parsedRequest.success) {
        throw new RequestValidationError("Invalid language-service request.");
      }

      const completion = await complete(request);
      try {
        return decodeStructured(completion, outputSchema);
      } catch (error) {
        if (
          !(error instanceof LlmGatewayError) ||
          error.kind !== "validation" ||
          completion.provider !== "groq" ||
          !config.openRouter
        ) {
          throw error;
        }
      }

      const fallback = await callProvider(
        "openrouter",
        config.openRouter,
        parsedRequest.data,
        config.timeoutMs,
        fetchImplementation,
      );
      return decodeStructured(fallback, outputSchema);
    },
  };
}
