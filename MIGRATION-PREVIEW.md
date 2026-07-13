# Supabase cutover — preview validation

This branch (`feature/auth-supabase-switch`) is the **full cutover candidate**:
Supabase Auth **+** every ported data service. Validate it on a Vercel preview
with the Supabase data backend flipped ON, before merging to production.

## 1. Deploy a preview

Push is done — Vercel will build a Preview deployment for this branch. Or:
`vercel --prebuilt` / trigger from the dashboard for `feature/auth-supabase-switch`.

## 2. Preview environment variables (Vercel → the Preview)

The **one flag that flips the whole app to Supabase**:

```
DATA_BACKEND=supabase
```

Confirm these are already present (Preview scope) — they were added during setup:

```
NEXT_PUBLIC_SUPABASE_URL=…
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_…
SUPABASE_SERVICE_ROLE_KEY=…          # server-only
SUPABASE_DB_URL=…                    # server-only (used by scripts, not runtime)
```

Everything else (Razorpay, Groq, Resend, reCAPTCHA, PostHog…) stays as-is.

> **OAuth on the preview URL:** for Google/GitHub sign-in to work on a
> `*.vercel.app` preview domain, add that preview URL to
> **Supabase → Authentication → URL Configuration → Redirect URLs**
> (and the app's `/auth/callback`). Email+password login needs no redirect.

> **Storage:** `DATA_BACKEND=supabase` also flips file uploads to Supabase
> Storage (buckets `resumes` + `newsletter` already created, both public), so
> `BLOB_READ_WRITE_TOKEN` is no longer needed on the preview. To keep uploads on
> Vercel Blob independently, set `DATA_BACKEND_STORAGE=mongo`.

## 3. Test checklist (all should work against migrated Supabase data)

**Auth**
- [ ] Log in with an existing account (email+password) — imported bcrypt hashes.
- [ ] Google / GitHub sign-in (re-links by email).
- [ ] Sign up a brand-new account.
- [ ] Forgot-password → reset email → set new password → log in.

**Core solve path (the critical one)**
- [ ] Open `/problems` — list loads, difficulty/company/tag filters work,
      solved/attempted status is correct for the logged-in user.
- [ ] Open a problem, run + **submit** a correct solution → Accepted.
- [ ] Dashboard XP / streak / level increased; the solve shows in recent activity.
- [ ] Submit again → no double-count of "first accept" XP.
- [ ] Heatmap gains today's square; leaderboard rank reflects the new XP.

**User data**
- [ ] Notes: create / edit / delete on a problem.
- [ ] Bookmarks: save/unsave a problem; it appears in `/bookmarks`.
- [ ] Roadmaps `/roadmaps/[track]`: topic progress reflects solves.
- [ ] Revision (spaced repetition): add a card, grade it.
- [ ] Profile `/profile/[username]`: public stats render.

**Billing / quotas**
- [ ] AI mentor chat works and decrements AI credits.
- [ ] Dashboard shows the correct plan; feature gates behave.

**Storage**
- [ ] Careers: upload a résumé (PDF) → admin can open it from the applicants list.
- [ ] Admin newsletter: upload an image → it renders in the composer/email.

## 4. What to watch for

Most likely class of bug: a **response-shape mismatch** on a route not yet
ported (the ~84 route files still reading Mongo directly). With
`DATA_BACKEND=supabase`, ported services read Supabase but **un-ported routes
still hit MongoDB** — so mixed reads are expected until every route is ported.
Note any page that errors or shows empty/stale data; that maps directly to a
route still needing the port.

## 5. Rollback

Nothing here touches production until this branch is merged. To abandon: delete
the preview / don't merge. Production `main` still runs MongoDB + NextAuth.
