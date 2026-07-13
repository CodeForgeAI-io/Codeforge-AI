import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireUser } from "@/lib/api-auth";
import { Bookmark } from "@/models";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { backendFor } from "@/lib/data-backend";
import { attachRefs, type SbBookmarkRow } from "@/services/bookmarks-store";

const be = () => backendFor("bookmarks");

export async function GET(req: NextRequest) {
  const { session, error } = await requireUser();
  if (error) return error;

  const kind = req.nextUrl.searchParams.get("kind") ?? undefined;
  const list = req.nextUrl.searchParams.get("list") ?? undefined;

  if (be() === "supabase") {
    let q = supabaseAdmin()
      .from("bookmarks")
      .select("id,kind,list,question_id,challenge_id,created_at")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });
    if (kind) q = q.eq("kind", kind);
    if (list) q = q.eq("list", list);
    const { data, error: qErr } = await q;
    if (qErr) return NextResponse.json({ error: qErr.message }, { status: 500 });
    const bookmarks = await attachRefs((data ?? []) as SbBookmarkRow[]);
    return NextResponse.json({ bookmarks });
  }

  await connectDB();
  const filter: Record<string, unknown> = { user: session.user.id };
  if (kind) filter.kind = kind;
  if (list) filter.list = list;

  const bookmarks = await Bookmark.find(filter)
    .sort({ createdAt: -1 })
    .populate("question", "slug title difficulty category tags")
    .populate("challenge", "slug title difficulty tech")
    .lean();

  return NextResponse.json({ bookmarks });
}

export async function POST(req: NextRequest) {
  const { session, error } = await requireUser();
  if (error) return error;

  const body = await req.json();
  const { kind, id, list = "Saved" } = body;

  if (!kind || !id) {
    return NextResponse.json({ error: "kind and id required" }, { status: 400 });
  }

  if (be() === "supabase") {
    const sb = supabaseAdmin();
    const col = kind === "question" ? "question_id" : kind === "challenge" ? "challenge_id" : null;
    if (!col) return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
    const { data: existing } = await sb
      .from("bookmarks")
      .select("id")
      .eq("user_id", session.user.id)
      .eq(col, id)
      .maybeSingle();
    if (existing) return NextResponse.json({ bookmark: existing, created: false });
    const { data, error: insErr } = await sb
      .from("bookmarks")
      .insert({ user_id: session.user.id, kind, list, [col]: id })
      .select("id,kind,list,question_id,challenge_id,created_at")
      .single();
    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });
    const [bookmark] = await attachRefs([data as SbBookmarkRow]);
    return NextResponse.json({ bookmark, created: true }, { status: 201 });
  }

  await connectDB();

  const filter: Record<string, unknown> = { user: session.user.id };
  if (kind === "question") filter.question = id;
  else if (kind === "challenge") filter.challenge = id;

  const existing = await Bookmark.findOne(filter);
  if (existing) {
    return NextResponse.json({ bookmark: existing, created: false });
  }

  const data: Record<string, unknown> = { user: session.user.id, kind, list };
  if (kind === "question") data.question = id;
  else if (kind === "challenge") data.challenge = id;

  const bookmark = await Bookmark.create(data);
  return NextResponse.json({ bookmark, created: true }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { session, error } = await requireUser();
  if (error) return error;

  const body = await req.json();
  const { kind, id } = body;

  if (!kind || !id) {
    return NextResponse.json({ error: "kind and id required" }, { status: 400 });
  }

  if (be() === "supabase") {
    const col = kind === "question" ? "question_id" : kind === "challenge" ? "challenge_id" : null;
    if (!col) return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
    await supabaseAdmin()
      .from("bookmarks")
      .delete()
      .eq("user_id", session.user.id)
      .eq(col, id);
    return NextResponse.json({ ok: true });
  }

  await connectDB();

  const filter: Record<string, unknown> = { user: session.user.id };
  if (kind === "question") filter.question = id;
  else if (kind === "challenge") filter.challenge = id;

  await Bookmark.deleteOne(filter);
  return NextResponse.json({ ok: true });
}
