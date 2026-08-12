-- Broaden existing, source-backed passages into the Library's displayed themes.
-- This changes discovery metadata only; passage text and citations remain untouched.

update public.quotes
set themes = themes || array['control']::text[]
where id in (
  '10000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000003',
  '20000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000003',
  '20000000-0000-4000-8000-000000000004',
  '7a28e500-e35c-4165-a655-09d5c144b7cf',
  '8c9315ca-6464-45e5-9af9-16eae636c2dc'
)
and not themes @> array['control']::text[];

update public.quotes
set themes = themes || array['patience']::text[]
where id in (
  '10000000-0000-4000-8000-000000000002',
  '10000000-0000-4000-8000-000000000003',
  '20000000-0000-4000-8000-000000000003',
  '20000000-0000-4000-8000-000000000004',
  '50000000-0000-4000-8000-000000000001',
  '5d426680-d75d-40e2-b574-3e0adcf9cf20',
  'ab2bf255-4758-4bc1-a30d-e106dfcd58b7',
  '62c0093c-6f2e-47fa-af28-337e19a1008d',
  '1e0fc71e-e598-4801-aa1b-106899731d33'
)
and not themes @> array['patience']::text[];

update public.quotes
set themes = themes || array['impermanence']::text[]
where id in (
  '10000000-0000-4000-8000-000000000002',
  '50000000-0000-4000-8000-000000000001',
  '0a5ba1d0-6865-44eb-814f-c6a2f55b61a6',
  'ee91d8d1-c13e-4bcf-a1ab-8a57b3ae7279',
  '81216b9d-6031-4b23-98c7-d5b0026e15f8'
)
and not themes @> array['impermanence']::text[];
