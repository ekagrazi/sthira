export const GUIDE_SLUGS = [
  "bhagavad-gita",
  "marcus-aurelius",
  "buddha",
  "rumi",
  "camus",
] as const;

export const MOOD_LABELS = [
  "anxious",
  "low",
  "frustrated",
  "angry",
  "grieving",
  "lost",
  "overwhelmed",
  "unmotivated",
  "restless",
  "guilty",
  "fearful",
  "tired",
  "insecure",
  "discontent",
  "stuck",
  "confused",
] as const;

export const MOOD_THEMES = [
  "acceptance",
  "action",
  "clarity",
  "forgiveness",
  "healing",
  "hope",
  "love",
  "patience",
  "peace",
  "perspective",
  "presence",
  "purpose",
  "resilience",
  "support",
] as const;

export const QUOTE_THEMES = [
  "acceptance",
  "action",
  "clarity",
  "connection",
  "control",
  "detachment",
  "discipline",
  "duty",
  "forgiveness",
  "healing",
  "home",
  "hope",
  "impermanence",
  "integrity",
  "longing",
  "love",
  "meaning",
  "mindset",
  "openness",
  "patience",
  "peace",
  "perspective",
  "practice",
  "presence",
  "purpose",
  "rebellion",
  "resilience",
  "self-mastery",
  "self-reliance",
  "simplicity",
  "solidarity",
  "struggle",
  "support",
] as const;

export const MOOD_EMOJIS = ["😊", "🙂", "😐", "😟", "😢", "😠"] as const;

export type GuideSlug = (typeof GUIDE_SLUGS)[number];
export type MoodEmoji = (typeof MOOD_EMOJIS)[number];
export type MoodLabel = (typeof MOOD_LABELS)[number];
export type MoodTheme = (typeof MOOD_THEMES)[number];

export type MoodProfile = {
  guideSlug: GuideSlug;
  sentimentScore: number;
  theme: MoodTheme;
};

export const MOOD_LABEL_PROFILES: Record<MoodLabel, MoodProfile> = {
  angry: { guideSlug: "buddha", sentimentScore: -0.7, theme: "forgiveness" },
  anxious: { guideSlug: "buddha", sentimentScore: -0.55, theme: "peace" },
  confused: { guideSlug: "buddha", sentimentScore: -0.3, theme: "clarity" },
  discontent: {
    guideSlug: "marcus-aurelius",
    sentimentScore: -0.35,
    theme: "perspective",
  },
  fearful: { guideSlug: "camus", sentimentScore: -0.65, theme: "resilience" },
  frustrated: {
    guideSlug: "marcus-aurelius",
    sentimentScore: -0.5,
    theme: "acceptance",
  },
  grieving: { guideSlug: "rumi", sentimentScore: -0.8, theme: "healing" },
  guilty: { guideSlug: "buddha", sentimentScore: -0.6, theme: "forgiveness" },
  insecure: { guideSlug: "camus", sentimentScore: -0.45, theme: "presence" },
  lost: { guideSlug: "bhagavad-gita", sentimentScore: -0.5, theme: "purpose" },
  low: { guideSlug: "camus", sentimentScore: -0.6, theme: "hope" },
  overwhelmed: {
    guideSlug: "bhagavad-gita",
    sentimentScore: -0.65,
    theme: "patience",
  },
  restless: { guideSlug: "buddha", sentimentScore: -0.4, theme: "peace" },
  stuck: {
    guideSlug: "marcus-aurelius",
    sentimentScore: -0.4,
    theme: "action",
  },
  tired: { guideSlug: "rumi", sentimentScore: -0.45, theme: "support" },
  unmotivated: {
    guideSlug: "marcus-aurelius",
    sentimentScore: -0.5,
    theme: "action",
  },
};

export const MOOD_EMOJI_PROFILES: Record<MoodEmoji, MoodProfile> = {
  "😊": { guideSlug: "rumi", sentimentScore: 0.65, theme: "love" },
  "🙂": { guideSlug: "marcus-aurelius", sentimentScore: 0.3, theme: "perspective" },
  "😐": { guideSlug: "marcus-aurelius", sentimentScore: 0, theme: "perspective" },
  "😟": { guideSlug: "buddha", sentimentScore: -0.5, theme: "peace" },
  "😢": { guideSlug: "rumi", sentimentScore: -0.75, theme: "healing" },
  "😠": { guideSlug: "buddha", sentimentScore: -0.7, theme: "forgiveness" },
};

export const NEUTRAL_MOOD_PROFILE: MoodProfile = {
  guideSlug: "marcus-aurelius",
  sentimentScore: 0,
  theme: "perspective",
};

export const MOOD_KEYWORDS: Record<MoodLabel, readonly string[]> = {
  angry: ["angry", "anger", "furious", "mad"],
  anxious: ["anxious", "anxiety", "nervous", "panic", "worried", "worry"],
  confused: ["cannot decide", "confused", "confusing", "don't understand", "uncertain"],
  discontent: ["discontent", "dissatisfied", "unhappy"],
  fearful: ["afraid", "fear", "fearful", "scared"],
  frustrated: ["annoyed", "frustrated", "frustration"],
  grieving: ["bereaved", "grief", "grieving", "miss them", "mourning"],
  guilty: ["ashamed", "guilt", "guilty", "shame"],
  insecure: ["doubt myself", "insecure", "not enough", "self doubt"],
  lost: ["aimless", "directionless", "lost"],
  low: ["depressed", "down", "sad"],
  overwhelmed: ["overloaded", "overwhelmed", "stressed", "too much"],
  restless: ["cannot settle", "can't settle", "restless"],
  stuck: ["blocked", "stuck", "trapped"],
  tired: ["burnout", "drained", "exhausted", "tired"],
  unmotivated: ["no motivation", "procrastinating", "unmotivated"],
};
