import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import type { AppSession as Session } from "@/lib/supabase-auth";

type AuthResult =
  | { session: Session; error: null }
  | { session: null; error: NextResponse };

/** Session guard for API routes (middleware also guards, defense in depth). */
export async function requireUser(): Promise<AuthResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      session: null,
      error: NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      ),
    };
  }
  return { session, error: null };
}

export async function requireAdmin(): Promise<AuthResult> {
  const result = await requireUser();
  if (result.error) return result;
  if (result.session.user.role !== "admin") {
    return {
      session: null,
      error: NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      ),
    };
  }
  return result;
}
