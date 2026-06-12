import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { joinContest } from "@/services/contests";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { session, error } = await requireUser();
  if (error) return error;

  const limited = await enforceRateLimit("api", req, session.user.id);
  if (limited) return limited;

  const { slug } = await params;
  const result = await joinContest(slug, session.user.id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
