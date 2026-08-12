-- Run after migrations and seed data. Any failed assertion raises an exception.
-- The transaction is always rolled back, so no test identities or rows remain.
begin;

insert into auth.users (id, raw_user_meta_data, created_at, updated_at)
values
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '{"full_name":"RLS User A","authorization":"ignored"}'::jsonb,
    now(),
    now()
  ),
  (
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    '{"full_name":"RLS User B","authorization":"ignored"}'::jsonb,
    now(),
    now()
  );

do $$
declare
  profile_count integer;
  copied_name text;
begin
  select count(*) into profile_count
  from public.profiles
  where id in (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
  );

  if profile_count <> 2 then
    raise exception 'profile trigger expected 2 rows, got %', profile_count;
  end if;

  select display_name into copied_name
  from public.profiles
  where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

  if copied_name <> 'RLS User A' then
    raise exception 'profile trigger did not copy display data';
  end if;
end;
$$;

insert into public.mood_checkins (id, user_id, mood_label)
values
  (
    'a1000000-0000-4000-8000-000000000001',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'calm'
  ),
  (
    'b1000000-0000-4000-8000-000000000001',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'calm'
  );

insert into public.journal_entries (id, user_id, quote_id, personal_note)
values
  (
    'a2000000-0000-4000-8000-000000000001',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '10000000-0000-4000-8000-000000000001',
    'owned by A'
  ),
  (
    'b2000000-0000-4000-8000-000000000001',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    '10000000-0000-4000-8000-000000000001',
    'owned by B'
  );

insert into public.chat_sessions (id, user_id, guide_id, title)
values
  (
    'a3000000-0000-4000-8000-000000000001',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '00000000-0000-4000-8000-000000000001',
    'A session'
  ),
  (
    'b3000000-0000-4000-8000-000000000001',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    '00000000-0000-4000-8000-000000000001',
    'B session'
  );

insert into public.chat_messages (
  id,
  session_id,
  role,
  content,
  client_action_id,
  response_status,
  response_started_at
)
values
  (
    'a4000000-0000-4000-8000-000000000001',
    'a3000000-0000-4000-8000-000000000001',
    'user',
    'A message',
    'a5000000-0000-4000-8000-000000000001',
    'generating',
    now()
  ),
  (
    'b4000000-0000-4000-8000-000000000001',
    'b3000000-0000-4000-8000-000000000001',
    'user',
    'B message',
    'b5000000-0000-4000-8000-000000000001',
    'generating',
    now()
  );

do $$
begin
  begin
    insert into public.chat_messages (
      session_id,
      role,
      content,
      client_action_id,
      response_status,
      response_started_at
    ) values (
      'a3000000-0000-4000-8000-000000000001',
      'user',
      'duplicate action',
      'a5000000-0000-4000-8000-000000000001',
      'generating',
      now()
    );
    raise exception 'duplicate client action was not blocked';
  exception
    when unique_violation then null;
  end;
end;
$$;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}',
  true
);

do $$
declare
  visible_count integer;
  affected_count integer;
begin
  if (select auth.uid()) <> 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid then
    raise exception 'auth.uid() did not resolve test user A';
  end if;

  select count(*) into visible_count from public.profiles;
  if visible_count <> 1 then
    raise exception 'profiles isolation expected 1 row, got %', visible_count;
  end if;

  select count(*) into visible_count from public.mood_checkins;
  if visible_count <> 1 then
    raise exception 'check-in isolation expected 1 row, got %', visible_count;
  end if;

  select count(*) into visible_count from public.journal_entries;
  if visible_count <> 1 then
    raise exception 'journal isolation expected 1 row, got %', visible_count;
  end if;

  select count(*) into visible_count from public.chat_sessions;
  if visible_count <> 1 then
    raise exception 'session isolation expected 1 row, got %', visible_count;
  end if;

  select count(*) into visible_count from public.chat_messages;
  if visible_count <> 1 then
    raise exception 'message isolation expected 1 row, got %', visible_count;
  end if;

  select count(*) into visible_count from public.user_streaks;
  if visible_count <> 1 then
    raise exception 'streak isolation expected 1 row, got %', visible_count;
  end if;

  update public.profiles
  set display_name = 'Updated by A'
  where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  get diagnostics affected_count = row_count;
  if affected_count <> 1 then
    raise exception 'owner profile update failed';
  end if;

  update public.profiles
  set display_name = 'Blocked'
  where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  get diagnostics affected_count = row_count;
  if affected_count <> 0 then
    raise exception 'cross-user profile update was not blocked';
  end if;

  delete from public.journal_entries
  where id = 'b2000000-0000-4000-8000-000000000001';
  get diagnostics affected_count = row_count;
  if affected_count <> 0 then
    raise exception 'cross-user journal delete was not blocked';
  end if;

  begin
    insert into public.mood_checkins (user_id, mood_label)
    values ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'blocked');
    raise exception 'cross-user check-in insert was not blocked';
  exception
    when insufficient_privilege then null;
  end;

  begin
    insert into public.chat_messages (session_id, role, content)
    values (
      'b3000000-0000-4000-8000-000000000001',
      'user',
      'blocked'
    );
    raise exception 'cross-user message insert was not blocked';
  exception
    when insufficient_privilege then null;
  end;

  if has_column_privilege(
    'authenticated',
    'public.journal_entries',
    'user_id',
    'update'
  ) then
    raise exception 'journal ownership column is unexpectedly updatable';
  end if;

  if has_table_privilege(
    'authenticated',
    'public.user_streaks',
    'update'
  ) then
    raise exception 'streak writes are unexpectedly client-accessible';
  end if;

  if has_column_privilege(
    'authenticated',
    'public.guides',
    'system_prompt',
    'select'
  ) then
    raise exception 'guide system prompts are unexpectedly client-readable';
  end if;
end;
$$;

reset role;
rollback;
