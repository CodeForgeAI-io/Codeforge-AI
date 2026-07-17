import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/user-provision";

export const runtime = "nodejs";

/**
 * Ensure the signed-in user's public.users profile row exists.
 *
 * OAuth redirects provision inside /auth/callback, but token-based sign-ins
 * (Google One Tap via signInWithIdToken) never pass through it — the client
 * calls this right after the session is minted. Idempotent; identity comes
 * from the session cookie, never the request body.
 */
export async function POST() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const u = data.user;
  const meta = (u.user_metadata ?? {}) as {
    full_name?: string;
    name?: string;
    avatar_url?: string;
    picture?: string;
  };
  try {
    await ensureProfile({
      id: u.id,
      email: u.email ?? "",
      name: meta.full_name ?? meta.name ?? "",
      image: meta.avatar_url ?? meta.picture ?? null,
      provider: (u.app_metadata?.provider as string | undefined) ?? "google",
    });
  } catch (e) {
    console.error("[provision] profile provisioning failed:", e);
    return NextResponse.json({ error: "Provisioning failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
