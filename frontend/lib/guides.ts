import type { GuideSlug, PublicGuide } from "@/lib/api/types";

export const guideAccents = ["gita", "marcus", "buddha", "rumi", "camus"] as const;

export type GuideAccent = (typeof guideAccents)[number];

export type GuideIdentity = {
  accent: GuideAccent;
  icon: string;
  name: string;
  shortDescription: string;
  slug: GuideSlug;
  tradition: string;
};

export const guideIdentities: readonly GuideIdentity[] = [
  {
    accent: "gita",
    icon: "☼",
    name: "Bhagavad Gita",
    shortDescription: "Duty, purpose, and steadiness without attachment to outcomes.",
    slug: "bhagavad-gita",
    tradition: "Scripture",
  },
  {
    accent: "marcus",
    icon: "◐",
    name: "Marcus Aurelius",
    shortDescription: "Discipline, perspective, and attention to what is within your control.",
    slug: "marcus-aurelius",
    tradition: "Stoicism",
  },
  {
    accent: "buddha",
    icon: "◎",
    name: "Buddha",
    shortDescription: "Mindfulness, impermanence, and a clear view of suffering.",
    slug: "buddha",
    tradition: "Buddhist teachings",
  },
  {
    accent: "rumi",
    icon: "✦",
    name: "Rumi",
    shortDescription: "Love, longing, and the transforming movement of the inner life.",
    slug: "rumi",
    tradition: "Sufi poetry",
  },
  {
    accent: "camus",
    icon: "◒",
    name: "Camus",
    shortDescription: "Meaning, freedom, and honest engagement with an uncertain world.",
    slug: "camus",
    tradition: "Existentialism",
  },
];

export function findGuide(slug: string): GuideIdentity | undefined {
  return guideIdentities.find((guide) => guide.slug === slug);
}

export function accentForGuide(guide: Pick<PublicGuide, "slug">): GuideAccent {
  return findGuide(guide.slug)?.accent ?? "marcus";
}
