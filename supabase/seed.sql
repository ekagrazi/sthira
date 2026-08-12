insert into public.guides (
  id,
  name,
  tradition,
  slug,
  short_desc,
  accent_color,
  icon
)
values
  (
    '00000000-0000-4000-8000-000000000001',
    'Bhagavad Gita',
    'Bhagavad Gita',
    'bhagavad-gita',
    'duty, purpose, detachment',
    '#D97706',
    'book-open'
  ),
  (
    '00000000-0000-4000-8000-000000000002',
    'Marcus Aurelius',
    'Stoicism',
    'marcus-aurelius',
    'control, discipline, acceptance',
    '#4B6B88',
    'landmark'
  ),
  (
    '00000000-0000-4000-8000-000000000003',
    'Buddha',
    'Dhammapada',
    'buddha',
    'suffering, mindfulness, impermanence',
    '#6B8E6B',
    'flower-2'
  ),
  (
    '00000000-0000-4000-8000-000000000004',
    'Rumi',
    'Sufi poetry',
    'rumi',
    'love, longing, transformation',
    '#7A5C8E',
    'moon-star'
  ),
  (
    '00000000-0000-4000-8000-000000000005',
    'Camus',
    'Existentialism',
    'camus',
    'absurdity, meaning, rebellion',
    '#8C8C8C',
    'pen-line'
  )
on conflict (slug) do update
set
  name = excluded.name,
  tradition = excluded.tradition,
  short_desc = excluded.short_desc,
  accent_color = excluded.accent_color,
  icon = excluded.icon;

-- Bhagavad Gita references were checked against Sir Edwin Arnold's
-- public-domain translation. Concise paraphrases keep the wording accessible.
insert into public.quotes (id, guide_id, text, citation, themes, mood_tags)
values
  (
    '10000000-0000-4000-8000-000000000001',
    (select id from public.guides where slug = 'bhagavad-gita'),
    'Your responsibility is action, never ownership of its results.',
    'Bhagavad Gita 2.47 (paraphrase)',
    array['duty', 'purpose', 'detachment'],
    array['anxious', 'frustrated', 'lost']
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    (select id from public.guides where slug = 'bhagavad-gita'),
    'Pleasure and pain arise from contact, then pass; meet them with patience.',
    'Bhagavad Gita 2.14 (paraphrase)',
    array['patience', 'impermanence'],
    array['overwhelmed', 'fearful']
  ),
  (
    '10000000-0000-4000-8000-000000000003',
    (select id from public.guides where slug = 'bhagavad-gita'),
    'The restless mind can be steadied through practice and detachment.',
    'Bhagavad Gita 6.35 (paraphrase)',
    array['discipline', 'practice'],
    array['restless', 'unmotivated']
  ),
  (
    '10000000-0000-4000-8000-000000000004',
    (select id from public.guides where slug = 'bhagavad-gita'),
    'Raise yourself through the self; do not let the self fall.',
    'Bhagavad Gita 6.5 (paraphrase)',
    array['self-reliance', 'discipline'],
    array['guilty', 'insecure']
  )
on conflict (id) do update
set
  guide_id = excluded.guide_id,
  text = excluded.text,
  citation = excluded.citation,
  themes = excluded.themes,
  mood_tags = excluded.mood_tags;

-- Marcus Aurelius references were checked against public-domain editions of
-- Meditations, including the George Long translation from Project Gutenberg.
insert into public.quotes (id, guide_id, text, citation, themes, mood_tags)
values
  (
    '20000000-0000-4000-8000-000000000001',
    (select id from public.guides where slug = 'marcus-aurelius'),
    'All trouble comes from what we think of external things within.',
    'Meditations 4.3 (paraphrase)',
    array['perspective', 'mindset'],
    array['low', 'discontent']
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    (select id from public.guides where slug = 'marcus-aurelius'),
    'Let no action be done at random or without principle.',
    'Meditations 4.2 (paraphrase)',
    array['action', 'integrity'],
    array['stuck', 'confused']
  ),
  (
    '20000000-0000-4000-8000-000000000003',
    (select id from public.guides where slug = 'marcus-aurelius'),
    'Other people will follow their course even if you burst in protest.',
    'Meditations 8.4 (paraphrase)',
    array['control', 'acceptance'],
    array['angry', 'frustrated']
  ),
  (
    '20000000-0000-4000-8000-000000000004',
    (select id from public.guides where slug = 'marcus-aurelius'),
    'You still have time to master anger, pain, and the hunger for praise.',
    'Meditations 8.8 (paraphrase)',
    array['discipline', 'self-mastery'],
    array['tired', 'overwhelmed']
  )
on conflict (id) do update
set
  guide_id = excluded.guide_id,
  text = excluded.text,
  citation = excluded.citation,
  themes = excluded.themes,
  mood_tags = excluded.mood_tags;

-- Dhammapada references use the public-domain Max Muller translation.
insert into public.quotes (id, guide_id, text, citation, themes, mood_tags)
values
  (
    '30000000-0000-4000-8000-000000000001',
    (select id from public.guides where slug = 'buddha'),
    'Hatred does not cease by hatred; hatred ceases by love.',
    'Dhammapada 5',
    array['forgiveness', 'love'],
    array['angry', 'guilty']
  ),
  (
    '30000000-0000-4000-8000-000000000002',
    (select id from public.guides where slug = 'buddha'),
    'Better than a thousand empty words is one word that brings peace.',
    'Dhammapada 100 (paraphrase)',
    array['peace', 'simplicity'],
    array['restless', 'anxious']
  ),
  (
    '30000000-0000-4000-8000-000000000003',
    (select id from public.guides where slug = 'buddha'),
    'Greater than conquering others is the conquest of oneself.',
    'Dhammapada 103-104 (paraphrase)',
    array['discipline', 'self-mastery'],
    array['unmotivated', 'stuck']
  ),
  (
    '30000000-0000-4000-8000-000000000004',
    (select id from public.guides where slug = 'buddha'),
    'Avoid harm, cultivate good, and purify the mind.',
    'Dhammapada 183 (paraphrase)',
    array['clarity', 'practice'],
    array['low', 'insecure']
  )
on conflict (id) do update
set
  guide_id = excluded.guide_id,
  text = excluded.text,
  citation = excluded.citation,
  themes = excluded.themes,
  mood_tags = excluded.mood_tags;

-- Rumi references use E. H. Whinfield's 1898 public-domain translation of
-- the Masnavi.
insert into public.quotes (id, guide_id, text, citation, themes, mood_tags)
values
  (
    '40000000-0000-4000-8000-000000000001',
    (select id from public.guides where slug = 'rumi'),
    'One far from home is always longing for the day of return.',
    'Masnavi, Book I, Prologue (paraphrase)',
    array['longing', 'home'],
    array['grieving', 'lost']
  ),
  (
    '40000000-0000-4000-8000-000000000002',
    (select id from public.guides where slug = 'rumi'),
    'A true lover is known by the pain carried in the heart.',
    'Masnavi, Book I, Description of Love (paraphrase)',
    array['love', 'healing'],
    array['overwhelmed', 'confused']
  ),
  (
    '40000000-0000-4000-8000-000000000003',
    (select id from public.guides where slug = 'rumi'),
    'Only love itself can explain love and those who love.',
    'Masnavi, Book I, Description of Love (paraphrase)',
    array['love', 'openness'],
    array['frustrated', 'angry']
  ),
  (
    '40000000-0000-4000-8000-000000000004',
    (select id from public.guides where slug = 'rumi'),
    'A friend is needed; do not travel the road alone.',
    'Masnavi, Book I (paraphrase)',
    array['connection', 'support'],
    array['tired', 'discontent']
  )
on conflict (id) do update
set
  guide_id = excluded.guide_id,
  text = excluded.text,
  citation = excluded.citation,
  themes = excluded.themes,
  mood_tags = excluded.mood_tags;

-- Camus entries retain only short, source-attributed passages.
insert into public.quotes (id, guide_id, text, citation, themes, mood_tags)
values
  (
    '50000000-0000-4000-8000-000000000001',
    (select id from public.guides where slug = 'camus'),
    'In the midst of winter, I found there was, within me, an invincible summer.',
    'Return to Tipasa',
    array['resilience', 'hope'],
    array['grieving', 'low']
  ),
  (
    '50000000-0000-4000-8000-000000000002',
    (select id from public.guides where slug = 'camus'),
    'The struggle itself toward the heights is enough to fill a man''s heart.',
    'The Myth of Sisyphus',
    array['meaning', 'struggle'],
    array['lost', 'stuck']
  ),
  (
    '50000000-0000-4000-8000-000000000003',
    (select id from public.guides where slug = 'camus'),
    'Real generosity toward the future lies in giving all to the present.',
    'The Rebel',
    array['presence', 'purpose'],
    array['fearful', 'insecure']
  ),
  (
    '50000000-0000-4000-8000-000000000004',
    (select id from public.guides where slug = 'camus'),
    'I rebel; therefore we exist.',
    'The Rebel',
    array['rebellion', 'solidarity'],
    array['unmotivated', 'restless']
  )
on conflict (id) do update
set
  guide_id = excluded.guide_id,
  text = excluded.text,
  citation = excluded.citation,
  themes = excluded.themes,
  mood_tags = excluded.mood_tags;
