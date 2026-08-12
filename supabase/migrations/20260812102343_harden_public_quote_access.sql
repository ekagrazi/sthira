-- Keep retired passages available to backend-owned journal references while
-- excluding them from direct anonymous and authenticated quote browsing.

drop policy if exists quotes_public_read on public.quotes;

create policy quotes_public_read
on public.quotes
for select
to anon, authenticated
using (archived_at is null);
