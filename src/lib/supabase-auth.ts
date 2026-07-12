import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Supabase-backed server session — the replacement for NextAuth's `auth()`.
 *
 * Returns the SAME shape NextAuth's session did, so the ~100 call sites that
 * read `session.user.id/.role/.username/.plan/.onboardingComplete` keep working
 * unchanged after the auth cutover. Identity comes from Supabase Auth
 * (`auth.getUser()`); the app-specific fields come from the `public.users`
 * profile (`id` = `auth.users.id`).
 *
 * Part of the NextAuth → Supabase Auth switch (see MIGRATION.md, Phase 5).
 */

export interface AppSessionUser {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
  role: "user" | "admin";
  username: string;
  onboardingComplete: boolean;
  plan: "free" | "go" | "plus";
}

export interface AppSession {
  user: AppSessionUser;
}

interface ProfileRow {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: "user" | "admin" | null;
  username: string;
  plan: "free" | "go" | "plus" | null;
  onboarding: { completed?: boolean } | null;
  banned: boolean | null;
}

/**
 * Read the current session, or null if signed out / banned.
 * `getUser()` re-validates the token with Supabase, so it is safe to trust.
 */
export async function auth(): Promise<AppSession | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabaseAdmin()
    .from("users")
    .select("id, email, name, image, role, username, plan, onboarding, banned")
    .eq("id", user.id)
    .maybeSingle();

  const p = data as ProfileRow | null;
  if (!p || p.banned) return null;

  return {
    user: {
      id: p.id,
      email: p.email ?? user.email ?? null,
      name: p.name,
      image: p.image,
      role: p.role ?? "user",
      username: p.username,
      onboardingComplete: Boolean(p.onboarding?.completed),
      plan: p.plan ?? "free",
    },
  };
}
