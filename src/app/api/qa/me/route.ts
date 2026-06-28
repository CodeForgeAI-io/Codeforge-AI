import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireUser } from "@/lib/api-auth";
import { QaContributor, BugReport } from "@/models";

export const runtime = "nodejs";

/** The signed-in user's QA membership status + the bugs they've reported. */
export async function GET() {
  const { session, error } = await requireUser();
  if (error) return error;

  await connectDB();
  const contributor = await QaContributor.findOne({ user: session.user.id })
    .select("status focusAreas createdAt reviewedAt")
    .lean();

  const bugs = contributor
    ? await BugReport.find({ reporter: session.user.id }).sort({ createdAt: -1 }).limit(200).lean()
    : [];

  return NextResponse.json({
    contributor: contributor
      ? { status: contributor.status, focusAreas: contributor.focusAreas ?? [], appliedAt: contributor.createdAt }
      : null,
    bugs: bugs.map((b) => ({
      id: b._id.toString(),
      title: b.title,
      area: b.area,
      severity: b.severity,
      status: b.status,
      createdAt: b.createdAt,
    })),
  });
}
