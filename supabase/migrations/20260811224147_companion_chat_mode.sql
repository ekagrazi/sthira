alter table public.chat_sessions
  add column mode text not null default 'guide',
  alter column guide_id drop not null;

alter table public.chat_sessions
  add constraint chat_sessions_mode_check
    check (mode in ('guide', 'companion')),
  add constraint chat_sessions_mode_guide_check
    check (
      (mode = 'guide' and guide_id is not null)
      or (mode = 'companion' and guide_id is null)
    );

create index idx_sessions_user_mode_updated
  on public.chat_sessions (user_id, mode, updated_at desc);

grant insert (mode) on table public.chat_sessions to authenticated;
