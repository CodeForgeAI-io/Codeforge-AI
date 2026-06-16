import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireUser } from "@/lib/api-auth";
import { Note } from "@/models";

export async function GET(req: NextRequest) {
  const { session, error } = await requireUser();
  if (error) return error;

  await connectDB();
  const questionId = req.nextUrl.searchParams.get("question") ?? undefined;

  const filter: Record<string, unknown> = { user: session.user.id };
  if (questionId) filter.question = questionId;

  const notes = await Note.find(filter)
    .sort({ updatedAt: -1 })
    .populate("question", "slug title")
    .lean();

  return NextResponse.json({ notes });
}

export async function POST(req: NextRequest) {
  const { session, error } = await requireUser();
  if (error) return error;

  const body = await req.json();
  const { questionId, challengeId, title, content, isPrivate = true, tags = [] } = body;

  await connectDB();

  const note = await Note.create({
    user: session.user.id,
    question: questionId ?? undefined,
    challenge: challengeId ?? undefined,
    title: title || "Untitled Note",
    content: content || "",
    isPrivate,
    tags,
  });

  return NextResponse.json({ note }, { status: 201 });
}
