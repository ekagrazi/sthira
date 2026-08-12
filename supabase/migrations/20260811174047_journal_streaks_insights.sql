create unique index idx_journal_user_quote_unique
  on public.journal_entries (user_id, quote_id);

create schema if not exists private;
revoke all on schema private from public, anon, authenticated, service_role;

create or replace function private.update_streak_after_checkin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  profile_timezone text;
  local_checkin_date date;
begin
  select profiles.timezone
  into profile_timezone
  from public.profiles
  where profiles.id = new.user_id;

  if profile_timezone is null then
    raise exception 'Profile timezone is required for streak calculation';
  end if;

  local_checkin_date := (new.created_at at time zone profile_timezone)::date;

  -- Timezone changes affect future check-ins; previously stored streak dates are not recalculated.
  insert into public.user_streaks (
    user_id,
    current_streak,
    longest_streak,
    last_checkin_date
  )
  values (new.user_id, 1, 1, local_checkin_date)
  on conflict (user_id) do update
  set
    current_streak = case
      when excluded.last_checkin_date <= public.user_streaks.last_checkin_date
        then public.user_streaks.current_streak
      when excluded.last_checkin_date = public.user_streaks.last_checkin_date + 1
        then public.user_streaks.current_streak + 1
      else 1
    end,
    longest_streak = greatest(
      public.user_streaks.longest_streak,
      case
        when excluded.last_checkin_date <= public.user_streaks.last_checkin_date
          then public.user_streaks.current_streak
        when excluded.last_checkin_date = public.user_streaks.last_checkin_date + 1
          then public.user_streaks.current_streak + 1
        else 1
      end
    ),
    last_checkin_date = greatest(
      public.user_streaks.last_checkin_date,
      excluded.last_checkin_date
    );

  return new;
end;
$$;

revoke all on function private.update_streak_after_checkin()
from public, anon, authenticated, service_role;

create trigger mood_checkin_updates_streak
  after insert on public.mood_checkins
  for each row execute function private.update_streak_after_checkin();

create or replace function public.get_user_insights(
  p_user_id uuid,
  p_from timestamptz,
  p_to timestamptz
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  result jsonb;
begin
  if p_to < p_from or p_to - p_from > interval '90 days' then
    raise exception 'Insights range must be between 0 and 90 days';
  end if;

  with profile_context as (
    select profiles.timezone
    from public.profiles
    where profiles.id = p_user_id
  ),
  filtered as materialized (
    select
      mood_checkins.detected_theme,
      mood_checkins.matched_guide_id,
      mood_checkins.sentiment_score,
      (mood_checkins.created_at at time zone profile_context.timezone)::date as local_date,
      extract(
        isodow from mood_checkins.created_at at time zone profile_context.timezone
      )::integer as weekday_number
    from public.mood_checkins
    cross join profile_context
    where mood_checkins.user_id = p_user_id
      and mood_checkins.created_at >= p_from
      and mood_checkins.created_at <= p_to
  ),
  guide_counts as (
    select
      guides.id as guide_id,
      guides.name,
      guides.slug,
      count(*)::integer as count
    from filtered
    join public.guides on guides.id = filtered.matched_guide_id
    group by guides.id, guides.name, guides.slug
  ),
  daily as (
    select
      filtered.local_date,
      count(*)::integer as count,
      round(avg(filtered.sentiment_score)::numeric, 3) as sentiment_score
    from filtered
    group by filtered.local_date
  ),
  themes as (
    select filtered.detected_theme as theme, count(*)::integer as count
    from filtered
    where filtered.detected_theme is not null
    group by filtered.detected_theme
  ),
  weekdays as (
    select filtered.weekday_number, count(*)::integer as count
    from filtered
    group by filtered.weekday_number
  )
  select jsonb_build_object(
    'summary', jsonb_build_object(
      'total_checkins', (select count(*)::integer from filtered),
      'current_streak', coalesce(
        (select user_streaks.current_streak
         from public.user_streaks
         where user_streaks.user_id = p_user_id),
        0
      ),
      'longest_streak', coalesce(
        (select user_streaks.longest_streak
         from public.user_streaks
         where user_streaks.user_id = p_user_id),
        0
      ),
      'top_guide', (
        select jsonb_build_object(
          'guide_id', guide_counts.guide_id,
          'name', guide_counts.name,
          'slug', guide_counts.slug,
          'count', guide_counts.count
        )
        from guide_counts
        order by guide_counts.count desc, guide_counts.name asc
        limit 1
      ),
      'most_active_weekday', (
        select trim(to_char(date '2024-01-01' + weekdays.weekday_number - 1, 'FMDay'))
        from weekdays
        order by weekdays.count desc, weekdays.weekday_number asc
        limit 1
      )
    ),
    'mood_points', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'date', daily.local_date,
          'sentiment_score', daily.sentiment_score
        ) order by daily.local_date
      )
      from daily
      where daily.sentiment_score is not null
    ), '[]'::jsonb),
    'guide_distribution', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'guide_id', guide_counts.guide_id,
          'name', guide_counts.name,
          'slug', guide_counts.slug,
          'count', guide_counts.count
        ) order by guide_counts.count desc, guide_counts.name asc
      )
      from guide_counts
    ), '[]'::jsonb),
    'theme_counts', coalesce((
      select jsonb_agg(
        jsonb_build_object('theme', themes.theme, 'count', themes.count)
        order by themes.count desc, themes.theme asc
      )
      from themes
    ), '[]'::jsonb),
    'heatmap', coalesce((
      select jsonb_agg(
        jsonb_build_object('date', daily.local_date, 'count', daily.count)
        order by daily.local_date
      )
      from daily
    ), '[]'::jsonb)
  ) into result;

  return result;
end;
$$;

revoke all on function public.get_user_insights(uuid, timestamptz, timestamptz)
from public, anon, authenticated;
grant execute on function public.get_user_insights(uuid, timestamptz, timestamptz)
to service_role;
