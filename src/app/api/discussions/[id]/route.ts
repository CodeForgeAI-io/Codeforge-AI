import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireUser } from "@/lib/api-auth";
import { Discussion } from "@/models";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { backendFor } from "@/lib/data-backend";
import {
  DISCUSSION_FULL_COLS,
  fetchAuthors,
  detailShape,
  type SbDiscussionRow,
} from "@/services/discussions-store";

const be = () => backendFor("discussions");

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (be() === "supabase") {
    const sb = supabaseAdmin();
    const { data } = await sb
      .from("discussions")
      .select(DISCUSSION_FULL_COLS)
      .eq("id", id)
      .maybeSingle();
    if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const row = data as SbDiscussionRow;
    // Best-effort view increment (non-critical counter).
    await sb.from("discussions").update({ views: (row.views ?? 0) + 1 }).eq("id", id);
    row.views = (row.views ?? 0) + 1;
    const authorIds = [
      row.author_id ?? "",
      ...(row.replies ?? []).map((r) => r.author),
    ].filter(Boolean);
    const authors = await fetchAuthors(authorIds);
    return NextResponse.json({ discussion: detailShape(row, authors) });
  }

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

  if (be() === "supabase") {
    const sb = supabaseAdmin();
    const { data } = await sb.from("discussions").select("author_id").eq("id", id).maybeSingle();
    if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const isOwner = (data as { author_id: string | null }).author_id === session.user.id;
    if (!isOwner && session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    await sb.from("discussions").delete().eq("id", id);
    return NextResponse.json({ ok: true });
  }

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
