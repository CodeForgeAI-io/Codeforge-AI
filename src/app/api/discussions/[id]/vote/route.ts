import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireUser } from "@/lib/api-auth";
import { Discussion } from "@/models";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireUser();
  if (error) return error;

  const { id } = await params;
  const { vote } = await req.json();
  if (vote !== 1 && vote !== -1) {
    return NextResponse.json({ error: "vote must be 1 or -1" }, { status: 400 });
  }

  await connectDB();
  const discussion = await Discussion.findById(id);
  if (!discussion) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const uid = session.user.id;
  const upIdx = discussion.upvotes.findIndex((u) => u.toString() === uid);
  const downIdx = discussion.downvotes.findIndex((u) => u.toString() === uid);

  if (vote === 1) {
    if (upIdx >= 0) {
      discussion.upvotes.splice(upIdx, 1);
    } else {
      discussion.upvotes.push(uid as never);
      if (downIdx >= 0) discussion.downvotes.splice(downIdx, 1);
    }
  } else {
    if (downIdx >= 0) {
      discussion.downvotes.splice(downIdx, 1);
    } else {
      discussion.downvotes.push(uid as never);
      if (upIdx >= 0) discussion.upvotes.splice(upIdx, 1);
    }
  }

  await discussion.save();
  return NextResponse.json({
    upvotes: discussion.upvotes.length,
    downvotes: discussion.downvotes.length,
    userVote: discussion.upvotes.some((u) => u.toString() === uid)
      ? 1
      : discussion.downvotes.some((u) => u.toString() === uid)
        ? -1
        : 0,
  });
}
