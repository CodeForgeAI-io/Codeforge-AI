import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireUser } from "@/lib/api-auth";
import { Discussion } from "@/models";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await connectDB();

  const discussion = await Discussion.findByIdAndUpdate(
    id,
    { $inc: { views: 1 } },
    { returnDocument: 'after' },
  )
    .populate("author", "username name image")
    .populate("replies.author", "username name image")
    .lean();

  if (!discussion) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ discussion });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireUser();
  if (error) return error;

  const { id } = await params;
  await connectDB();

  const discussion = await Discussion.findById(id);
  if (!discussion) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOwner = discussion.author.toString() === session.user.id;
  const isAdmin = session.user.role === "admin";
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await discussion.deleteOne();
  return NextResponse.json({ ok: true });
}
