import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { deleteUserAndData } from "@/services/account";

export const runtime = "nodejs";

/** Self-service account deletion for the signed-in user. */
export async function DELETE(req: NextRequest) {
  const { session, error } = await requireUser();
  if (error) return error;

  const limited = await enforceRateLimit("auth", req, session.user.id);
  if (limited) return limited;

  const deleted = await deleteUserAndData(session.user.id);
  if (!deleted) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
