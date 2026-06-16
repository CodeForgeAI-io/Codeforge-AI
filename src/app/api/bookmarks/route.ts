import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireUser } from "@/lib/api-auth";
import { Bookmark, Question, FrontendChallenge } from "@/models";

export async function GET(req: NextRequest) {
  const { session, error } = await requireUser();
  if (error) return error;

  await connectDB();
  const kind = req.nextUrl.searchParams.get("kind") ?? undefined;
  const list = req.nextUrl.searchParams.get("list") ?? undefined;

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

  await connectDB();

  const filter: Record<string, unknown> = { user: session.user.id };
  if (kind === "question") filter.question = id;
  else if (kind === "challenge") filter.challenge = id;

  await Bookmark.deleteOne(filter);
  return NextResponse.json({ ok: true });
}
