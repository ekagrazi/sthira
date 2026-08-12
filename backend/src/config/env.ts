import { z } from "zod";

const optionalSecret = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().min(10).optional(),
);

const backendEnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  SUPABASE_URL: z.url(),
  SUPABASE_SECRET_KEY: z.string().min(20),
  FRONTEND_URL: z.url(),
  OPENROUTER_API_KEY: optionalSecret,
  OPENROUTER_MODEL: z.string().min(1).default("openai/gpt-oss-20b:free"),
  GROQ_API_KEY: optionalSecret,
  GROQ_MODEL: z.string().min(1).default("openai/gpt-oss-20b"),
  LLM_TIMEOUT_MS: z.coerce.number().int().min(1_000).max(15_000).default(6_000),
  PORT: z.coerce.number().int().min(1).max(65_535).default(4000),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
});

export type BackendEnv = {
  nodeEnv: z.infer<typeof backendEnvSchema>["NODE_ENV"];
  supabaseUrl: string;
  supabaseSecretKey: string;
  frontendOrigins: string[];
  openRouterApiKey: string | undefined;
  openRouterModel: string;
  groqApiKey: string | undefined;
  groqModel: string;
  llmTimeoutMs: number;
  port: number;
  logLevel: z.infer<typeof backendEnvSchema>["LOG_LEVEL"];
};

export function loadBackendEnv(
  source: NodeJS.ProcessEnv = process.env,
): BackendEnv {
  const result = backendEnvSchema.safeParse(source);

  if (!result.success) {
    const invalidNames = [
      ...new Set(result.error.issues.map((issue) => issue.path.join("."))),
    ].join(", ");

    throw new Error(
      `Invalid or missing backend environment: ${invalidNames}. Check backend/.env.example.`,
    );
  }

  return {
    nodeEnv: result.data.NODE_ENV,
    supabaseUrl: result.data.SUPABASE_URL,
    supabaseSecretKey: result.data.SUPABASE_SECRET_KEY,
    frontendOrigins: [
      ...new Set([
        ...(result.data.NODE_ENV === "production"
          ? []
          : ["http://localhost:3000"]),
        new URL(result.data.FRONTEND_URL).origin,
      ]),
    ],
    openRouterApiKey: result.data.OPENROUTER_API_KEY,
    openRouterModel: result.data.OPENROUTER_MODEL,
    groqApiKey: result.data.GROQ_API_KEY,
    groqModel: result.data.GROQ_MODEL,
    llmTimeoutMs: result.data.LLM_TIMEOUT_MS,
    port: result.data.PORT,
    logLevel: result.data.LOG_LEVEL,
  };
}
