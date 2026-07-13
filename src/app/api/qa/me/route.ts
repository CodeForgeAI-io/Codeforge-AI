import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { getContributor, listUserBugs } from "@/services/qa-store";

export const runtime = "nodejs";

/** The signed-in user's QA membership status + the bugs they've reported. */
export async function GET() {
  const { session, error } = await requireUser();
  if (error) return error;

  const contributor = await getContributor(session.user.id);
  const bugs = contributor ? await listUserBugs(session.user.id, 200) : [];

  return NextResponse.json({
    contributor: contributor
      ? { status: contributor.status, focusAreas: contributor.focusAreas, appliedAt: contributor.createdAt }
      : null,
    bugs,
  });
}
