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
| **3. Schema completion** | All 33 tables + indexes applied to Supabase | ✅ done |
| 4. Port modules | Repository + route swap per module | 🟡 feedback + job_applications done |
| 5. **Auth → Supabase Auth** | Replace NextAuth with Supabase Auth (email/password + Google/GitHub OAuth already configured in Supabase); migrate user identities | ⬜ (large) |
| 6. **Storage → Supabase Storage** | Move résumé / blog cover / newsletter uploads off Vercel Blob | ⬜ |
| 7. Data backfill | Copy + transform all live documents (ObjectId → uuid remap) | ⬜ |
| 8. Cutover | Flip `DATA_BACKEND=supabase`, verify, keep Mongo as rollback | ⬜ |

## Cutover ordering (important)
The per-module flag lets code target either backend, but **data cutover order is
constrained by references**:
- **Standalone modules** (no cross-refs) can be backfilled + flipped on their
  own: `feedback` ✅, `job_applications` ✅, and later `bug_reports`,
  `qa_contributors`, `coupons`, `prompt_templates`, `feature_access`,
  `site_config`, `webhook_events`, `razorpay_plans`.
- **The interconnected core** (`users` ↔ `questions` ↔ `submissions` ↔
  `bookmarks`/`notes`/`progress`/`discussions`/`ai_*` …) references itself, so
  its Supabase reads only work once *all* of it is backfilled. These get the
  repository/route swap now, but flip **together** via global `DATA_BACKEND=supabase`
  after a full backfill — not one at a time.

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

## Schema (Phase 3 — ✅ complete)
**All 33 tables live** in Supabase (one per Mongoose model):
- 0001 core: users, questions, submissions, subscriptions, coupons, coupon_redemptions, feedback, razorpay_plans, webhook_events, site_config.
- 0003 content/learning: notes, bookmarks, progress, daily_activity, spaced_repetition, discussions, contests, roadmaps, companies, badges, user_badges, follows, blog_posts.
- 0004 ai/qa/careers: frontend_challenges, job_applications, bug_reports, qa_contributors, prompt_templates, feature_access, ai_chats, ai_tool_runs, ai_usage, gen_usage.

Cross-entity FKs (challenge_id, discussion_id, …) are plain uuid for now; a
final migration will add them once backfill has populated ids.

## Auth (Phase 5) — moving to Supabase Auth  ← CRITICAL PATH

This is the linchpin: **most modules are user-linked** (they filter by
`session.user.id`), and today that id is a Mongo ObjectId. Supabase paths for
those modules only work once identities live in Supabase. So the users/auth
migration must land before the interconnected core can flip.

### Design
- **`auth.users` vs `public.users`.** Supabase Auth owns `auth.users` (email,
  password hash, OAuth identities, sessions). Our `public.users` becomes a
  **profile** table whose `id` **equals** `auth.users.id`
  (`id uuid primary key references auth.users(id)`), not a standalone
  gen_random_uuid(). → the Phase-1 `users` table needs this adjustment before
  backfill.
- **Session/middleware.** Replace NextAuth JWT with Supabase Auth cookies via
  `@supabase/ssr` (clients already scaffolded). Every `auth()` /
  `session.user.id` call site and the route-protection middleware change to
  `supabase.auth.getUser()`. Large surface, but mechanical.
- **OAuth.** Google + GitHub are already configured in Supabase; users re-link
  by email on their next OAuth sign-in.
- **Cutover.** For a given request, either NextAuth or Supabase issues the
  session — no half state. Build Supabase Auth flows alongside, migrate
  identities, then switch sign-in/up + middleware in **one deploy**; rollback =
  revert the deploy. Not auto-merged.

### Decisions (locked)
- Password migration: **import bcrypt hashes** (verified compatible — no resets).
- Cutover: **hard switch** on cutover day.

### Build status (branch `feature/auth-supabase-switch`, off main)
1. ✅ Supabase session reader (`supabase-auth.ts`), `@/lib/auth` re-exports it.
2. ✅ Sign-in/up/OAuth backend (`auth-actions.ts`, `user-provision.ts`, `/auth/callback`).
3. ✅ Forms (login/register/oauth/beta) + `SupabaseAuthProvider`/`useSession`/`signOut` shim (`auth-client.tsx`, `/api/auth/me`).
4. ✅ Middleware → Supabase `getClaims()`; admin gate reads `app_metadata.role` (set on provision + import).
5. ✅ `api-auth` uses `AppSession`; all `auth()` call sites unchanged.
6. ✅ Removed NextAuth route/config/register-route/type-aug. (dep `next-auth` still in package.json — harmless, remove at cleanup.)

Typecheck + 100 tests + lint green. Coexists safely off main.

### Remaining before cutover
- **Password reset** (`/api/auth/forgot-password`, `/reset-password`) still uses
  Mongo tokens → port to `supabase.auth.resetPasswordForEmail` + a recovery page.
- Remove the `next-auth` dependency.
- **Cutover runbook**: (1) `node scripts/backfill/users.mjs --apply` (identities +
  hashes + `app_metadata.role`), (2) backfill the rest of the core, (3) set
  `DATA_BACKEND=supabase`, (4) deploy this branch, (5) verify sign-in / sign-up /
  Google / GitHub / admin gate / a protected route. Rollback = revert the deploy.

## Applying migrations
Migrations live in `supabase/migrations/*.sql`. Apply with the Supabase CLI
(`supabase link` + `supabase db push`) or directly against `SUPABASE_DB_URL`.

## ⚠️ Security
The service-role key + DB password were shared in plaintext during setup —
**rotate them** (Dashboard → Settings → Database / API). Keys live only in
`.env.local` (gitignored) and Vercel env; never commit them.
