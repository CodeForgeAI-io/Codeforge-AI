# MongoDB → Supabase (Postgres) Migration

A **phased** migration of the whole backend from MongoDB/Mongoose to **Supabase**
for everything: **Auth** (Supabase Auth, replacing NextAuth), **Storage**
(Supabase Storage, replacing Vercel Blob), and **Database** (Postgres). Each
module flips behind a default-off flag, so the app keeps working on MongoDB
until each piece is tested and cut over.

## Status

| Phase | What | State |
|---|---|---|
| **1. Foundation** | Supabase project, clients, core schema, plan | ✅ done |
| **2. Data-access pattern** | `backendFor()` flag + repository; **feedback pilot** (create/list/update/delete) verified against Supabase | ✅ pilot done |
| 3. Schema completion | Remaining ~24 tables + indexes | ⬜ |
| 4. Port modules | Repository + route swap per module, behind `DATA_BACKEND_<MODULE>` | ⬜ |
| 5. **Auth → Supabase Auth** | Replace NextAuth with Supabase Auth (email/password + Google/GitHub OAuth already configured in Supabase); migrate user identities | ⬜ (large) |
| 6. **Storage → Supabase Storage** | Move résumé / blog cover / newsletter uploads off Vercel Blob | ⬜ |
| 7. Data backfill | Copy + transform all live documents (ObjectId → uuid remap) | ⬜ |
| 8. Cutover | Flip `DATA_BACKEND=supabase`, verify, keep Mongo as rollback | ⬜ |

## The flag
`backendFor(module)` (`src/lib/data-backend.ts`) chooses per module:
`DATA_BACKEND_<MODULE>=supabase` (one module) → `DATA_BACKEND=supabase` (all) →
`mongo` (default). So merging migration code to main changes **nothing** in
production until a flag is set in Vercel env.

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

## Schema progress (Phase 3)
**23 tables live** in Supabase.
- 0001 (core): users, questions, submissions, subscriptions, coupons,
  coupon_redemptions, feedback, razorpay_plans, webhook_events, site_config.
- 0003 (content/learning): notes, bookmarks, progress, daily_activity,
  spaced_repetition, discussions, contests, roadmaps, companies, badges,
  user_badges, follows, blog_posts.

**Still to add:** ai_chats, ai_tool_runs, ai_usage, bug_reports,
feature_access, frontend_challenges, gen_usage, job_applications,
prompt_templates, qa_contributors.

## Auth (Phase 5) — moving to Supabase Auth
Target: replace **NextAuth** with **Supabase Auth** (email/password + Google &
GitHub OAuth, whose callbacks are already configured in Supabase). This is the
largest phase — it touches every session read, the middleware, OAuth flows, and
sign-in/up UI. Plan: stand up Supabase Auth alongside NextAuth, migrate user
identities (email/password hashes may need a reset-on-first-login flow since
Supabase manages its own `auth.users`), switch session handling to
`@supabase/ssr`, then remove NextAuth. Kept behind its own rollout so the rest
of the DB migration isn't blocked on it.

## Applying migrations
Migrations live in `supabase/migrations/*.sql`. Apply with the Supabase CLI
(`supabase link` + `supabase db push`) or directly against `SUPABASE_DB_URL`.

## ⚠️ Security
The service-role key + DB password were shared in plaintext during setup —
**rotate them** (Dashboard → Settings → Database / API). Keys live only in
`.env.local` (gitignored) and Vercel env; never commit them.
