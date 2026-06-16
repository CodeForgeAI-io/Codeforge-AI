import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { requireUser } from "@/lib/api-auth";
import { Discussion } from "@/models";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; replyId: string }> },
) {
  const { session, error } = await requireUser();
  if (error) return error;

  const { id, replyId } = await params;
  await connectDB();

  const discussion = await Discussion.findById(id);
  if (!discussion) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const reply = discussion.replies.find((r) => r._id.toString() === replyId);
  if (!reply) return NextResponse.json({ error: "Reply not found" }, { status: 404 });

  const isOwner = reply.author.toString() === session.user.id;
  const isAdmin = session.user.role === "admin";
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Remove the reply and any direct sub-replies that reference it
  await Discussion.updateOne(
    { _id: id },
    { $pull: { replies: { _id: new Types.ObjectId(replyId) } } },
  );
  await Discussion.updateOne(
    { _id: id },
    { $pull: { replies: { parentReply: new Types.ObjectId(replyId) } } },
  );

  return NextResponse.json({ ok: true });
}
