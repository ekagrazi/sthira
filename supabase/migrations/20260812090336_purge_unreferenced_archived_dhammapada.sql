-- Permanently remove archived Dhammapada passages that no journal entry retains.
-- Journal-linked passages remain available so saved entries preserve their source.

set local lock_timeout = '5s';
set local statement_timeout = '30s';

delete from public.quotes as quote
using public.guides as guide
where quote.guide_id = guide.id
  and guide.slug = 'buddha'
  and quote.archived_at is not null
  and not exists (
    select 1
    from public.journal_entries as entry
    where entry.quote_id = quote.id
  );
