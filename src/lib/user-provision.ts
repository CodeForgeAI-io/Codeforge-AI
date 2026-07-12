import { customAlphabet } from "nanoid";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Creating / ensuring a `public.users` profile for a Supabase-Auth identity.
 * Used by sign-up and by the OAuth callback (first login). Part of the
 * NextAuth → Supabase Auth switch.
 */

const suffix = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 6);

export function isAdminEmail(email: string): boolean {
  const admins = (process.env.ADMIN_EMAILS ?? process.env.ADMIN_EMAIL ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(email.toLowerCase());
}

/** Generate a username unique in `public.users`. */
export async function generateUniqueUsername(base: string): Promise<string> {
  const cleaned = base.toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 20) || "coder";
  const candidate = cleaned.length >= 3 ? cleaned : `${cleaned}123`;
  const { data } = await supabaseAdmin().from("users").select("id").eq("username", candidate).maybeSingle();
  if (!data) return candidate;
  return `${candidate.slice(0, 20)}-${suffix()}`;
}

/**
 * Ensure a profile row exists for an authenticated user. On first sight it's
 * created (generating a username when one isn't supplied); on later logins it
 * just merges the OAuth provider. `id` must equal the Supabase auth user id.
 */
export async function ensureProfile(input: {
  id: string;
  email: string;
  name?: string | null;
  username?: string;
  image?: string | null;
  provider?: string;
}): Promise<void> {
  const sb = supabaseAdmin();
  const { data: existing } = await sb.from("users").select("id, providers").eq("id", input.id).maybeSingle();

  if (existing) {
    if (input.provider) {
      const cur = (existing as { providers: string[] | null }).providers ?? [];
      const providers = Array.from(new Set([...cur, input.provider]));
      await sb.from("users").update({ providers }).eq("id", input.id);
    }
    return;
  }

  const username = input.username ?? (await generateUniqueUsername(input.name || input.email.split("@")[0]));
  const role = isAdminEmail(input.email) ? "admin" : "user";
  const { error } = await sb.from("users").insert({
    id: input.id,
    email: input.email.toLowerCase(),
    name: input.name ?? "",
    username,
    image: input.image ?? null,
    role,
    providers: input.provider ? [input.provider] : [],
  });
  if (error) throw new Error(error.message);
  // Mirror role into the auth JWT so middleware can gate admin areas without a
  // DB read (read as claims.app_metadata.role).
  await sb.auth.admin.updateUserById(input.id, { app_metadata: { role } });
}
