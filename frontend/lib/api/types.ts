export type GuideSlug =
  | "bhagavad-gita"
  | "marcus-aurelius"
  | "buddha"
  | "rumi"
  | "camus";

export type PublicGuide = {
  accent_color: string | null;
  icon: string | null;
  id: string;
  name: string;
  short_desc: string | null;
  slug: GuideSlug;
  tradition: string;
};

export type PublicQuote = {
  citation: string | null;
  content_type?: "direct_quote" | "paraphrase" | "source_based_reflection";
  guide_id: string;
  id: string;
  mood_tags: string[];
  rights_basis?: string | null;
  source_url?: string | null;
  source_work?: string | null;
  text: string;
  themes: string[];
  translator?: string | null;
};

export type MoodCheckin = {
  created_at: string;
  detected_theme: string | null;
  id: string;
  matched_guide_id: string | null;
  matched_quote_id: string | null;
  mood_emoji: string | null;
  mood_label: string | null;
  sentiment_score: number | null;
};

export type MoodResult = {
  checkin: MoodCheckin;
  matched_guide: PublicGuide;
  matched_quote: PublicQuote;
};

export type MoodRerollResult = Pick<MoodResult, "matched_guide" | "matched_quote">;

export type JournalEntrySummary = {
  checkin_id: string | null;
  created_at: string;
  guide: Pick<PublicGuide, "accent_color" | "id" | "name">;
  id: string;
  personal_note: string | null;
  quote: Pick<PublicQuote, "citation" | "content_type" | "guide_id" | "id" | "source_work" | "text" | "translator">;
  tags: string[];
};

export type JournalList = {
  entries: JournalEntrySummary[];
  next_cursor: string | null;
};

export type ChatSessionSummary = {
  created_at: string;
  guide: PublicGuide | null;
  id: string;
  mode: "companion" | "guide";
  title: string | null;
  updated_at: string;
};

export type LibraryPassage = {
  guide: PublicGuide;
  journal_entry_id: string | null;
  quote: PublicQuote;
};

export type LibraryResponse = {
  next_cursor: string | null;
  passages: LibraryPassage[];
};

export type ChatSessionList = {
  next_cursor: string | null;
  sessions: ChatSessionSummary[];
};

export type ChatMessage = {
  client_action_id: string | null;
  content: string;
  created_at: string;
  id: string;
  response_status: "complete" | "failed" | "generating" | null;
  role: "guide" | "user";
};

export type ChatMessageList = {
  messages: ChatMessage[];
  next_cursor: string | null;
};

export type ChatTurn = {
  guide_message: ChatMessage | null;
  status: "complete" | "failed" | "pending";
  user_message: ChatMessage;
};

export type StreakSummary = {
  current_streak: number;
  last_checkin_date: string | null;
  longest_streak: number;
};

export type InsightsResponse = {
  guide_distribution: Array<{
    count: number;
    guide_id: string;
    name: string;
    slug: GuideSlug;
  }>;
  heatmap: Array<{ count: number; date: string }>;
  mood_points: Array<{ date: string; sentiment_score: number }>;
  summary: {
    current_streak: number;
    longest_streak: number;
    most_active_weekday: string | null;
    top_guide: {
      count: number;
      guide_id: string;
      name: string;
      slug: GuideSlug;
    } | null;
    total_checkins: number;
  };
  theme_counts: Array<{ count: number; theme: string }>;
};

export type WisdomResponse = {
  wisdom: Array<{ guide: PublicGuide; quote: PublicQuote }>;
};
