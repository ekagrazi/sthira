-- Remote migration version: 20260810203406
create table public.profiles (
  id uuid primary key
    constraint profiles_id_fkey references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  timezone text not null default 'Asia/Kolkata',
  onboarding_intent text,
  onboarded boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.guides (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tradition text not null,
  slug text not null constraint guides_slug_key unique,
  short_desc text,
  accent_color text,
  icon text,
  system_prompt text,
  created_at timestamptz not null default now()
);

create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  guide_id uuid not null
    constraint quotes_guide_id_fkey references public.guides (id) on delete restrict,
  text text not null,
  citation text,
  themes text[] not null default '{}'::text[],
  mood_tags text[] not null default '{}'::text[],
  created_at timestamptz not null default now()
);

create table public.mood_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null
    constraint mood_checkins_user_id_fkey references public.profiles (id) on delete cascade,
  mood_emoji text,
  mood_label text,
  free_text text,
  sentiment_score numeric
    constraint mood_checkins_sentiment_score_check
      check (sentiment_score between -1 and 1),
  detected_theme text,
  matched_guide_id uuid
    constraint mood_checkins_matched_guide_id_fkey references public.guides (id) on delete set null,
  matched_quote_id uuid
    constraint mood_checkins_matched_quote_id_fkey references public.quotes (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null
    constraint journal_entries_user_id_fkey references public.profiles (id) on delete cascade,
  quote_id uuid not null
    constraint journal_entries_quote_id_fkey references public.quotes (id) on delete restrict,
  checkin_id uuid
    constraint journal_entries_checkin_id_fkey references public.mood_checkins (id) on delete set null,
  personal_note text,
  tags text[] not null default '{}'::text[],
  created_at timestamptz not null default now()
);

create table public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null
    constraint chat_sessions_user_id_fkey references public.profiles (id) on delete cascade,
  guide_id uuid not null
    constraint chat_sessions_guide_id_fkey references public.guides (id) on delete restrict,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null
    constraint chat_messages_session_id_fkey references public.chat_sessions (id) on delete cascade,
  role text not null
    constraint chat_messages_role_check check (role in ('user', 'guide')),
  content text not null,
  created_at timestamptz not null default now()
);

create table public.user_streaks (
  user_id uuid primary key
    constraint user_streaks_user_id_fkey references public.profiles (id) on delete cascade,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_checkin_date date,
  constraint user_streaks_nonnegative_check
    check (current_streak >= 0 and longest_streak >= current_streak)
);

create index idx_quotes_guide_id on public.quotes (guide_id);
create index idx_quotes_themes on public.quotes using gin (themes);
create index idx_quotes_mood_tags on public.quotes using gin (mood_tags);

create index idx_checkins_user_date
  on public.mood_checkins (user_id, created_at desc);
create index idx_checkins_matched_guide
  on public.mood_checkins (matched_guide_id)
  where matched_guide_id is not null;
create index idx_checkins_matched_quote
  on public.mood_checkins (matched_quote_id)
  where matched_quote_id is not null;

create index idx_journal_user_date
  on public.journal_entries (user_id, created_at desc);
create index idx_journal_quote on public.journal_entries (quote_id);
create index idx_journal_checkin
  on public.journal_entries (checkin_id)
  where checkin_id is not null;

create index idx_sessions_user_updated
  on public.chat_sessions (user_id, updated_at desc);
create index idx_sessions_guide on public.chat_sessions (guide_id);

create index idx_messages_session
  on public.chat_messages (session_id, created_at);
