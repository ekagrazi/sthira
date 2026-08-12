import { z } from "zod";

const publicSupabaseEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
});

const publicBackendEnvSchema = z.object({
  NEXT_PUBLIC_BACKEND_URL: z.url(),
});

export function getPublicSupabaseEnv() {
  const result = publicSupabaseEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });

  if (!result.success) {
    const missingNames = result.error.issues
      .map((issue) => issue.path.join("."))
      .join(", ");

    throw new Error(`Invalid or missing frontend environment: ${missingNames}`);
  }

  return {
    supabaseUrl: result.data.NEXT_PUBLIC_SUPABASE_URL,
    supabasePublishableKey:
      result.data.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  };
}

export function getPublicBackendUrl(): string {
  const result = publicBackendEnvSchema.safeParse({
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
  });

  if (!result.success) {
    throw new Error("Invalid or missing frontend environment: NEXT_PUBLIC_BACKEND_URL");
  }

  const url = new URL(result.data.NEXT_PUBLIC_BACKEND_URL);
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("NEXT_PUBLIC_BACKEND_URL must use HTTP or HTTPS.");
  }
  return url.origin;
}

export function getSiteUrl(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (configuredUrl) {
    const url = new URL(configuredUrl);

    if (url.protocol !== "https:" && url.protocol !== "http:") {
      throw new Error("NEXT_PUBLIC_SITE_URL must use HTTP or HTTPS.");
    }

    return url.origin;
  }

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("NEXT_PUBLIC_SITE_URL is required in production.");
  }

  return "http://localhost:3000";
}
