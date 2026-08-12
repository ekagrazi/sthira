# Supabase database

The schema is represented by ordered SQL migrations in `migrations/`. `seed.sql` supplies repeatable baseline guide and passage records. Applied migrations are immutable; every later schema, policy, or corpus change gets a new timestamped migration.

## Local workflow

Docker Desktop or another compatible Docker runtime is required.

```powershell
npm run db:start
npm run db:reset
npm run db:lint
npm run db:migrations
npm run db:stop
```

`db:reset` rebuilds the local database, applies all migrations in order, and runs the idempotent seed. `tests/security_verification.sql` is a rollback-only integration check for the profile trigger and cross-user isolation.

## Access model

Every table in the exposed `public` schema has Row Level Security enabled.

| Resource | Anonymous | Authenticated | Backend service role |
|---|---|---|---|
| Guides | Approved public columns | Approved public columns | Read/write |
| Active passages | Read | Read | Read/write, including retained retired rows |
| Profiles | None | Own row: read | Read/write |
| Mood check-ins | None | Own rows: read | Read/write |
| Journal entries | None | Own rows: read/delete | Read/write |
| Chat sessions | None | Own rows: read/delete | Read/write |
| Chat messages | None | Own session: read | Read/write |
| User streaks | None | Own row: read | Read/write |

Writes flow through the authenticated Express API. Browser grants are intentionally narrower than the policies: a policy alone does not grant a table operation.

The `guides.system_prompt` column is not selectable by anonymous or authenticated roles. Privileged trigger functions have a fixed search path and restricted execution. The insights function is callable only by the backend service role. Retired passages remain available to backend-owned journal references but are excluded from public passage browsing.

## Content records

Passages carry stable IDs and source metadata: citation, source work, source URL, translator, rights basis, and content type. The offline scripts in `tools/quote-content` fetch approved public sources, normalize text, validate records, and generate deterministic SQL. Fetching, parsing, and bulk tagging are not runtime API tasks.

Journal-linked passages use restrictive deletion so a saved reflection never loses its source. Unreferenced retired records can be removed by a dedicated migration.
