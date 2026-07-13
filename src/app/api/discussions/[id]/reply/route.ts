import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { connectDB } from "@/lib/mongodb";
import { requireUser } from "@/lib/api-auth";
import { Discussion } from "@/models";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { backendFor } from "@/lib/data-backend";
import { fetchAuthors, type SbReply } from "@/services/discussions-store";

const be = () => backendFor("discussions");

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

  if (be() === "supabase") {
    const sb = supabaseAdmin();
    const { data } = await sb.from("discussions").select("replies").eq("id", id).maybeSingle();
    if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const replies = ((data as { replies: SbReply[] | null }).replies ?? []).slice();
    const newReply: SbReply = {
      _id: randomUUID(),
      author: session.user.id,
      content: content.trim(),
      createdAt: new Date().toISOString(),
      ...(parentReplyId ? { parentReply: parentReplyId } : {}),
    };
    replies.push(newReply);
    const { error: upErr } = await sb.from("discussions").update({ replies }).eq("id", id);
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });
    const authors = await fetchAuthors([session.user.id]);
    const reply = {
      _id: newReply._id,
      author: authors.get(session.user.id) ?? null,
      content: newReply.content,
      parentReply: newReply.parentReply ?? null,
      createdAt: newReply.createdAt,
    };
    return NextResponse.json({ reply }, { status: 201 });
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
