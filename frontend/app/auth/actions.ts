"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import type { AuthActionState } from "@/lib/auth/action-state";
import { getSafeReturnPath } from "@/lib/auth/return-path";
import { getPostAuthenticationPath } from "@/lib/auth/session";
import { getSiteUrl } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

const emailSchema = z.string().trim().email("Enter a valid email address.");
const passwordSchema = z
  .string()
  .min(8, "Password must contain at least 8 characters.")
  .max(72, "Password must contain at most 72 characters.");

const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

const signupSchema = loginSchema.extend({
  displayName: z
    .string()
    .trim()
    .min(2, "Name must contain at least 2 characters.")
    .max(80, "Name must contain at most 80 characters."),
});

function authErrorMessage(code?: string): string {
  switch (code) {
    case "email_not_confirmed":
      return "Confirm your email address before signing in.";
    case "invalid_credentials":
      return "The email address or password is incorrect.";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "Too many attempts. Wait a moment and try again.";
    case "weak_password":
      return "Choose a stronger password and try again.";
    default:
      return "Authentication could not be completed. Try again.";
  }
}

export async function login(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const result = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!result.success) {
    return { fieldErrors: result.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(result.data);

  if (error || !data.user) {
    return { message: authErrorMessage(error?.code) };
  }

  const destination = await getPostAuthenticationPath(
    supabase,
    data.user.id,
    getSafeReturnPath(String(formData.get("next") ?? "")),
  );

  redirect(destination);
}

export async function signup(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const result = signupSchema.safeParse({
    displayName: formData.get("displayName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!result.success) {
    return { fieldErrors: result.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const callbackUrl = new URL("/auth/callback", getSiteUrl());
  callbackUrl.searchParams.set("next", "/onboarding");

  const { data, error } = await supabase.auth.signUp({
    email: result.data.email,
    password: result.data.password,
    options: {
      data: { full_name: result.data.displayName },
      emailRedirectTo: callbackUrl.toString(),
    },
  });

  if (error) {
    return { message: authErrorMessage(error.code) };
  }

  if (data.session && data.user) {
    redirect("/onboarding");
  }

  return {
    success: true,
    message: "Check your email to confirm your account, then sign in.",
  };
}

export async function signInWithGoogle(formData: FormData): Promise<void> {
  const requestedPath = getSafeReturnPath(
    String(formData.get("next") ?? ""),
  );
  const callbackUrl = new URL("/auth/callback", getSiteUrl());
  callbackUrl.searchParams.set("next", requestedPath);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: callbackUrl.toString() },
  });

  if (error || !data.url) {
    const loginUrl = new URL("/login", getSiteUrl());
    loginUrl.searchParams.set("error", "oauth_unavailable");
    loginUrl.searchParams.set("next", requestedPath);
    redirect(`${loginUrl.pathname}${loginUrl.search}`);
  }

  redirect(data.url);
}

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
