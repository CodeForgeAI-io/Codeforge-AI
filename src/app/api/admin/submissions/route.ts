import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/api-auth";
import { Submission, SUBMISSION_STATUSES_GUARD } from "@/models/submission-helpers";

export const dynamic = "force-dynamic";

/** Admin: latest submissions across the platform, optionally by status */
export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  await connectDB();
  const status = req.nextUrl.searchParams.get("status");
  const query: Record<string, unknown> = {};
  if (status && SUBMISSION_STATUSES_GUARD.includes(status)) {
    query.status = status;
  }

  const submissions = await Submission.find(query)
    .sort({ createdAt: -1 })
    .limit(100)
    .populate<{ user: { name: string; username: string } | null }>(
      "user",
      "name username",
    )
    .populate<{ question: { title: string; slug: string } | null }>(
      "question",
      "title slug",
    )
    .populate<{ challenge: { title: string; slug: string } | null }>(
      "challenge",
      "title slug",
    )
    .select("kind status language passedCount totalCount runtimeMs createdAt user question challenge")
    .lean();

  return NextResponse.json({
    submissions: submissions.map((submission) => ({
      id: submission._id.toString(),
      kind: submission.kind,
      status: submission.status,
      language: submission.language ?? null,
      passedCount: submission.passedCount,
      totalCount: submission.totalCount,
      runtimeMs: submission.runtimeMs ?? null,
      createdAt: submission.createdAt,
      user: submission.user
        ? { name: submission.user.name, username: submission.user.username }
        : null,
      target: submission.question
        ? { title: submission.question.title, href: `/problems/${submission.question.slug}` }
        : submission.challenge
          ? { title: submission.challenge.title, href: `/challenges/${submission.challenge.slug}` }
          : null,
    })),
  });
}
