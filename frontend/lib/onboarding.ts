import { z } from "zod";

export const onboardingOptions = [
  {
    description: "Create a little more room around difficult feelings.",
    label: "Find more calm",
    value: "calm",
  },
  {
    description: "Meet hard days with patience and a steadier response.",
    label: "Build resilience",
    value: "resilience",
  },
  {
    description: "Notice recurring feelings with greater clarity.",
    label: "Understand my patterns",
    value: "patterns",
  },
  {
    description: "Make a thoughtful pause part of everyday life.",
    label: "Reflect consistently",
    value: "reflection",
  },
  {
    description: "Learn from several enduring philosophical traditions.",
    label: "Explore perspectives",
    value: "perspectives",
  },
  {
    description: "Name an intention in your own words.",
    label: "Something personal",
    value: "personal",
  },
] as const;

export type OnboardingChoice = (typeof onboardingOptions)[number]["value"];

export const onboardingSchema = z.object({
  choice: z.enum(
    onboardingOptions.map((option) => option.value) as [
      OnboardingChoice,
      ...OnboardingChoice[],
    ],
    { message: "Choose the intention that feels closest." },
  ),
  details: z
    .string()
    .trim()
    .max(180, "Keep the optional note within 180 characters."),
});

export function formatOnboardingIntent(input: {
  choice: OnboardingChoice;
  details: string;
}): string {
  const label = onboardingOptions.find((option) => option.value === input.choice)!.label;
  return input.details ? `${label} — ${input.details}` : label;
}

export function parseOnboardingIntent(intent?: string): {
  choice?: OnboardingChoice;
  details: string;
} {
  if (!intent) return { details: "" };

  const option = onboardingOptions.find(
    ({ label }) => intent === label || intent.startsWith(`${label} — `),
  );

  if (!option) return { choice: "personal", details: intent.slice(0, 180) };

  return {
    choice: option.value,
    details: intent.slice(option.label.length).replace(/^ — /u, "").slice(0, 180),
  };
}
