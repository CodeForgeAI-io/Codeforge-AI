"use server";

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { registerSchema, loginSchema } from "@/schemas/auth";
import { ensureProfile } from "@/lib/user-provision";
import { verifyRecaptcha } from "@/lib/recaptcha";

/**
 * Supabase Auth server actions — the replacements for NextAuth's
 * signIn/signOut. Part of the auth cutover (see MIGRATION.md, Phase 5).
 */

export interface AuthActionResult {
  ok: boolean;
  error?: string;
}

export async function signInAction(email: string, password: string): Promise<AuthActionResult> {
  const parsed = loginSchema.safeParse({ email, password });
  if (!parsed.success) return { ok: false, error: "Invalid credentials" };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email.toLowerCase(),
    password: parsed.data.password,
  });
  if (error) return { ok: false, error: "Invalid email or password" };
  return { ok: true };
}

export async function signUpAction(input: unknown, recaptchaToken?: string | null): Promise<AuthActionResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const rc = await verifyRecaptcha(recaptchaToken, { action: "register" });
  if (!rc.ok) return { ok: false, error: "Couldn't verify you're human. Please try again." };

  const { name, username, email, password } = parsed.data;
  const admin = supabaseAdmin();

  const { data: emailTaken } = await admin.from("users").select("id").eq("email", email.toLowerCase()).maybeSingle();
  if (emailTaken) return { ok: false, error: "An account with this email already exists" };
  const { data: usernameTaken } = await admin.from("users").select("id").eq("username", username).maybeSingle();
  if (usernameTaken) return { ok: false, error: "This username is already taken" };

  // Create a confirmed auth user, then the profile, then sign in (sets cookies).
  const created = await admin.auth.admin.createUser({
    email: email.toLowerCase(),
    password,
    email_confirm: true,
    user_metadata: { name, username },
  });
  if (created.error || !created.data.user) {
    return { ok: false, error: created.error?.message ?? "Could not create your account" };
  }
  await ensureProfile({ id: created.data.user.id, email, name, username });

  const supabase = await createClient();
  await supabase.auth.signInWithPassword({ email: email.toLowerCase(), password });
  return { ok: true };
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
