import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

import { getSafeReturnPath } from "@/lib/auth/return-path";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type AuthenticatedProfile = {
  userId: string;
  displayName: string | null;
  onboarded: boolean;
  onboardingIntent: string | null;
};

async function readProfile(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<AuthenticatedProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("display_name, onboarded, onboarding_intent")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error("Unable to read the authenticated profile.");
  }

  if (!data) {
    return null;
  }

  return {
    userId,
    displayName: data.display_name,
    onboarded: data.onboarded,
    onboardingIntent: data.onboarding_intent,
  };
}

export async function getAuthenticatedProfile(): Promise<AuthenticatedProfile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (error || typeof userId !== "string") {
    return null;
  }

  return readProfile(supabase, userId);
}

export async function getPostAuthenticationPath(
  supabase: SupabaseClient<Database>,
  userId: string,
  requestedPath?: string | null,
): Promise<string> {
  const profile = await readProfile(supabase, userId);

  if (!profile?.onboarded) {
    return "/onboarding";
  }

  return getSafeReturnPath(requestedPath, "/dashboard");
}

export async function redirectAuthenticatedUser(): Promise<void> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (!error && typeof userId === "string") {
    redirect(await getPostAuthenticationPath(supabase, userId));
  }
}

export async function requireAuthenticatedProfile(): Promise<AuthenticatedProfile> {
  const profile = await getAuthenticatedProfile();

  if (!profile) {
    redirect("/login");
  }

  return profile;
}

export async function requireCompletedProfile(): Promise<AuthenticatedProfile> {
  const profile = await requireAuthenticatedProfile();

  if (!profile.onboarded) {
    redirect("/onboarding");
  }

  return profile;
}
