# MongoDB → Supabase (Postgres) Migration

A **phased** migration of the whole backend from MongoDB/Mongoose to Supabase
Postgres. The app keeps running on MongoDB until the final cutover — nothing in
production is touched until each phase is tested.

## Status

| Phase | What | State |
|---|---|---|
| **1. Foundation** | Supabase project, clients, core schema, plan | ✅ done (this branch) |
| 2. Data-access layer | Pick query layer (postgres.js + a typed repo), repository per table | ⬜ next |
| 3. Schema completion | Remaining ~24 tables + indexes | ⬜ |
| 4. Auth | Move users + rewrite `authorize()` / OAuth provisioning to Postgres (keep NextAuth JWT) | ⬜ |
| 5. Port modules | Migrate services/routes table-by-table behind a flag | ⬜ |
| 6. Data backfill | Copy + transform all live documents (ObjectId → uuid remap) | ⬜ |
| 7. Cutover | Maintenance window, flip `DATA_BACKEND`, verify, keep Mongo as rollback | ⬜ |

## Phase 1 delivered

- `supabase init` → `supabase/config.toml`, `supabase/migrations/`.
- Deps: `@supabase/supabase-js`, `@supabase/ssr`, `postgres` (query/migration driver), `supabase` CLI (dev).
- Clients: `src/lib/supabase/{client,server,middleware}.ts` (SSR, publishable key) + `admin.ts` (service-role, server-only, bypasses RLS).
- **Core schema applied** to the Supabase project — `supabase/migrations/0001_init_core.sql`:
  `users, questions, submissions, subscriptions, coupons, coupon_redemptions, feedback, razorpay_plans, webhook_events, site_config`.

### Schema conventions
- PK `uuid default gen_random_uuid()`; every table keeps `legacy_mongo_id text unique` so the Phase-6 copy can remap old ObjectId FKs → new uuids.
- Embedded Mongo sub-docs (`stats`, `preferences`, `onboarding`, `billing`, `examples`, `test_cases`, `test_results`, …) → `jsonb`.
- `snake_case` columns (Postgres idiom); the data layer maps to the app's camelCase.
- **RLS enabled, no policies** → only the service-role backend can read/write; anon gets nothing.

## Remaining tables (Phase 3)
ai_chats, ai_tool_runs, ai_usage, badges, blog_posts, bookmarks, bug_reports,
companies, contests, daily_activity, discussions, feature_access, follows,
frontend_challenges, gen_usage, job_applications, notes, progress,
prompt_templates, qa_contributors, roadmaps, spaced_repetition, user_badges.

## Auth (Phase 4)
Auth is **NextAuth JWT + Credentials, no DB adapter** — sessions are JWTs, and
`authorize()` / OAuth sign-in query the `User` model directly. So the auth
migration is small: move the `users` table, then repoint those two lookups at
Postgres. NextAuth stays; we are **not** switching to Supabase Auth (that would
rearchitect every session/OAuth path for no functional gain here).

## Applying migrations
Migrations live in `supabase/migrations/*.sql`. Apply with the Supabase CLI
(`supabase link` + `supabase db push`) or directly against `SUPABASE_DB_URL`.

## ⚠️ Security
The service-role key + DB password were shared in plaintext during setup —
**rotate them** (Dashboard → Settings → Database / API). Keys live only in
`.env.local` (gitignored) and Vercel env; never commit them.
