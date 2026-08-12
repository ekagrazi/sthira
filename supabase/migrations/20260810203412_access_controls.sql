-- Remote migration version: 20260810203412
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated, service_role;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.guides enable row level security;
alter table public.quotes enable row level security;
alter table public.mood_checkins enable row level security;
alter table public.journal_entries enable row level security;
alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;
alter table public.user_streaks enable row level security;

create policy profiles_select_own
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

create policy profiles_update_own
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy checkins_select_own
  on public.mood_checkins
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy checkins_insert_own
  on public.mood_checkins
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy journal_select_own
  on public.journal_entries
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy journal_insert_own
  on public.journal_entries
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy journal_update_own
  on public.journal_entries
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy journal_delete_own
  on public.journal_entries
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create policy sessions_select_own
  on public.chat_sessions
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy sessions_insert_own
  on public.chat_sessions
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy sessions_update_own
  on public.chat_sessions
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy sessions_delete_own
  on public.chat_sessions
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create policy messages_select_own
  on public.chat_messages
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.chat_sessions
      where chat_sessions.id = chat_messages.session_id
        and chat_sessions.user_id = (select auth.uid())
    )
  );

create policy messages_insert_own
  on public.chat_messages
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.chat_sessions
      where chat_sessions.id = chat_messages.session_id
        and chat_sessions.user_id = (select auth.uid())
    )
  );

create policy streaks_select_own
  on public.user_streaks
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy guides_public_read
  on public.guides
  for select
  to anon, authenticated
  using (true);

create policy quotes_public_read
  on public.quotes
  for select
  to anon, authenticated
  using (true);

revoke all on table
  public.profiles,
  public.guides,
  public.quotes,
  public.mood_checkins,
  public.journal_entries,
  public.chat_sessions,
  public.chat_messages,
  public.user_streaks
from public, anon, authenticated;

grant usage on schema public to anon, authenticated, service_role;

grant select (id, name, tradition, slug, short_desc, accent_color, icon, created_at)
  on table public.guides to anon, authenticated;
grant select on table public.quotes to anon, authenticated;

grant select on table public.profiles to authenticated;
grant update (display_name, avatar_url, timezone, onboarding_intent, onboarded)
  on table public.profiles to authenticated;

grant select on table public.mood_checkins to authenticated;
grant insert (
  user_id,
  mood_emoji,
  mood_label,
  free_text,
  sentiment_score,
  detected_theme,
  matched_guide_id,
  matched_quote_id
)
  on table public.mood_checkins to authenticated;

grant select, delete on table public.journal_entries to authenticated;
grant insert (user_id, quote_id, checkin_id, personal_note, tags)
  on table public.journal_entries to authenticated;
grant update (personal_note, tags)
  on table public.journal_entries to authenticated;

grant select, delete on table public.chat_sessions to authenticated;
grant insert (user_id, guide_id, title)
  on table public.chat_sessions to authenticated;
grant update (title, updated_at)
  on table public.chat_sessions to authenticated;

grant select on table public.chat_messages to authenticated;
grant insert (session_id, role, content)
  on table public.chat_messages to authenticated;

grant select on table public.user_streaks to authenticated;

grant select, insert, update, delete on table
  public.profiles,
  public.guides,
  public.quotes,
  public.mood_checkins,
  public.journal_entries,
  public.chat_sessions,
  public.chat_messages,
  public.user_streaks
to service_role;

alter default privileges for role postgres in schema public
  revoke select, insert, update, delete on tables from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke usage, select on sequences from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated, service_role;
