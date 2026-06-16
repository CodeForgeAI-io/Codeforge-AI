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
  const { content, parentReplyId } = await req.json();
  if (!content?.trim()) {
    return NextResponse.json({ error: "Content required" }, { status: 400 });
  }

  await connectDB();
  const discussion = await Discussion.findById(id);
  if (!discussion) return NextResponse.json({ error: "Not found" }, { status: 404 });

  discussion.replies.push({
    author: session.user.id,
    content: content.trim(),
    ...(parentReplyId ? { parentReply: parentReplyId } : {}),
  } as never);
  await discussion.save();
  await discussion.populate("replies.author", "username name image");

  const reply = discussion.replies[discussion.replies.length - 1];
  return NextResponse.json({ reply }, { status: 201 });
}
