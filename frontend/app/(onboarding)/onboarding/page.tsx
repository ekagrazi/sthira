import { redirect } from "next/navigation";

import { OnboardingForm } from "@/components/onboarding-form";
import { Brand } from "@/components/brand";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { requireAuthenticatedProfile } from "@/lib/auth/session";

export default async function OnboardingPage() {
  const profile = await requireAuthenticatedProfile();

  if (profile.onboarded) {
    redirect("/dashboard");
  }

  return (
    <main className="relative z-10 mx-auto w-full max-w-4xl">
      <div className="mb-7 flex justify-center">
        <Brand className="text-xl" />
      </div>
      <Card>
        <CardHeader className="border-b pb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Your intention
          </p>
          <h1 className="font-serif text-4xl font-medium tracking-[-0.04em]">Begin with purpose</h1>
          <CardDescription className="max-w-xl leading-6">
            This gives your reflection space a clear direction and can be revised later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OnboardingForm defaultIntent={profile.onboardingIntent ?? undefined} />
        </CardContent>
      </Card>
    </main>
  );
}
