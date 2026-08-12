-- Add useful Library themes to active passages using conservative text matches.
-- The conditions mirror tools/quote-content/pipeline.mjs so corpus rebuilds retain them.

update public.quotes
set themes = array_append(themes, 'control')
where archived_at is null
  and not (themes @> array['control']::text[])
  and text ilike any (array[
    '%control%',
    '%restrain%',
    '%self-command%',
    '%self-mastery%',
    '%master of%',
    '%govern%',
    '%within our power%',
    '%in our power%'
  ]);

update public.quotes
set themes = array_append(themes, 'patience')
where archived_at is null
  and not (themes @> array['patience']::text[])
  and text ilike any (array[
    '%patience%',
    '%patient%',
    '%patiently%',
    '%forbear%',
    '%forbearance%',
    '%long-suffering%',
    '%silently shall I endure%',
    '%endures reproach%'
  ]);
