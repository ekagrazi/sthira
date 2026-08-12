"use server";

import { redirect } from "next/navigation";

import { formatOnboardingIntent, onboardingSchema } from "@/lib/onboarding";
import { createClient } from "@/lib/supabase/server";

export type OnboardingActionState = {
  fieldErrors?: { choice?: string[]; details?: string[] };
  message?: string;
};

export async function saveOnboarding(
  _previousState: OnboardingActionState,
  formData: FormData,
): Promise<OnboardingActionState> {
  const result = onboardingSchema.safeParse({
    choice: formData.get("choice"),
    details: formData.get("details") ?? "",
  });

  if (!result.success) {
    return { fieldErrors: result.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || typeof userId !== "string") {
    redirect("/login");
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({
      onboarded: true,
      onboarding_intent: formatOnboardingIntent(result.data),
    })
    .eq("id", userId)
    .eq("onboarded", false)
    .select("onboarded")
    .maybeSingle();

  if (data?.onboarded) {
    redirect("/dashboard");
  }

  if (!error) {
    const { data: existingProfile, error: profileError } = await supabase
      .from("profiles")
      .select("onboarded")
      .eq("id", userId)
      .maybeSingle();

    if (!profileError && existingProfile?.onboarded) {
      redirect("/dashboard");
    }
  }

  return {
    message: error
      ? "Your intention could not be saved. Check your connection and try again."
      : "Your profile is still being prepared. Try again in a moment.",
  };
}
