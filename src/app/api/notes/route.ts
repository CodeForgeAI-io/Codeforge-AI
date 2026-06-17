import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireUser } from "@/lib/api-auth";
import { Note } from "@/models";
import { sanitizeUserContent, cap } from "@/lib/sanitize";

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

  const body = await req.json() as Record<string, unknown>;
  const title = cap(String(body.title ?? "Untitled Note"), 200);
  const content = cap(String(body.content ?? ""), 100_000);
  const isPrivate = body.isPrivate !== false;
  const tags = Array.isArray(body.tags)
    ? (body.tags as unknown[]).slice(0, 10).map((t) => cap(String(t), 40))
    : [];
  const questionId = body.questionId ? String(body.questionId) : undefined;
  const challengeId = body.challengeId ? String(body.challengeId) : undefined;

  await connectDB();

  const note = await Note.create({
    user: session.user.id,
    question: questionId,
    challenge: challengeId,
    title: sanitizeUserContent(title) || "Untitled Note",
    content: sanitizeUserContent(content),
    isPrivate,
    tags: tags.map(sanitizeUserContent),
  });

  return NextResponse.json({ note }, { status: 201 });
}
