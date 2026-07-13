import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireUser } from "@/lib/api-auth";
import { Discussion } from "@/models";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { backendFor } from "@/lib/data-backend";

const be = () => backendFor("discussions");

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

  const uid = session.user.id;

  if (be() === "supabase") {
    const sb = supabaseAdmin();
    const { data } = await sb
      .from("discussions")
      .select("upvotes,downvotes")
      .eq("id", id)
      .maybeSingle();
    if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const up = new Set((data as { upvotes: string[] | null }).upvotes ?? []);
    const down = new Set((data as { downvotes: string[] | null }).downvotes ?? []);
    if (vote === 1) {
      if (up.has(uid)) up.delete(uid);
      else { up.add(uid); down.delete(uid); }
    } else {
      if (down.has(uid)) down.delete(uid);
      else { down.add(uid); up.delete(uid); }
    }
    const upArr = [...up];
    const downArr = [...down];
    const { error: upErr } = await sb
      .from("discussions")
      .update({ upvotes: upArr, downvotes: downArr })
      .eq("id", id);
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });
    return NextResponse.json({
      upvotes: upArr.length,
      downvotes: downArr.length,
      userVote: up.has(uid) ? 1 : down.has(uid) ? -1 : 0,
    });
  }

  await connectDB();
  const discussion = await Discussion.findById(id);
  if (!discussion) return NextResponse.json({ error: "Not found" }, { status: 404 });
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
