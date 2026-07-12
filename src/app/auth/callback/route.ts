import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/user-provision";

export const runtime = "nodejs";

/**
 * OAuth (Google/GitHub) callback. Supabase redirects here with a `code`; we
 * exchange it for a session, ensure the user's `public.users` profile exists
 * (first login), then send them on. Part of the auth cutover.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/dashboard";

  if (!code) return NextResponse.redirect(new URL("/login?error=oauth", req.url));

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) {
    return NextResponse.redirect(new URL("/login?error=oauth", req.url));
  }

  const u = data.user;
  const meta = (u.user_metadata ?? {}) as { full_name?: string; name?: string; avatar_url?: string; picture?: string };
  try {
    await ensureProfile({
      id: u.id,
      email: u.email ?? "",
      name: meta.full_name ?? meta.name ?? "",
      image: meta.avatar_url ?? meta.picture ?? null,
      provider: (u.app_metadata?.provider as string | undefined) ?? undefined,
    });
  } catch (e) {
    console.error("[oauth-callback] profile provisioning failed:", e);
    // Session is valid even if the profile write hiccuped; the session reader
    // will 404 the profile and the user can retry — don't hard-fail the login.
  }

  return NextResponse.redirect(new URL(next, req.url));
}
