import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/** List the signed-in user's passkeys (for settings). */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { data } = await supabaseAdmin()
    .from("webauthn_credentials")
    .select("id,name,created_at,last_used_at")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });

  return NextResponse.json({
    passkeys: (data ?? []).map((p) => ({
      id: p.id as string,
      name: (p.name as string | null) ?? null,
      createdAt: p.created_at as string,
      lastUsedAt: (p.last_used_at as string | null) ?? null,
    })),
  });
}
