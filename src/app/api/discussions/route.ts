import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireUser } from "@/lib/api-auth";
import { Discussion } from "@/models";
import { escapeRegex, sanitizeUserContent, cap } from "@/lib/sanitize";

export async function GET(req: NextRequest) {
  await connectDB();
  const questionId = req.nextUrl.searchParams.get("question") ?? undefined;
  const kind = req.nextUrl.searchParams.get("kind") ?? undefined;
  const page = Math.max(1, Number(req.nextUrl.searchParams.get("page") ?? 1));
  const limit = 20;

  const q = req.nextUrl.searchParams.get("q") ?? undefined;

  const filter: Record<string, unknown> = {};
  if (questionId) filter.question = questionId;
  if (kind) filter.kind = kind;
  if (q) filter.title = { $regex: escapeRegex(q), $options: "i" };

  const [discussions, total] = await Promise.all([
    Discussion.find(filter)
      .sort({ isPinned: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("author", "username name image")
      .select("-replies")
      .lean(),
    Discussion.countDocuments(filter),
  ]);

  return NextResponse.json({ discussions, total, page, pages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const { session, error } = await requireUser();
  if (error) return error;

  const body = await req.json() as Record<string, unknown>;
  const title = cap(String(body.title ?? ""), 200);
  const content = cap(String(body.content ?? ""), 50_000);
  const VALID_KINDS = ["discussion", "question", "solution"] as const;
  type DiscussionKind = typeof VALID_KINDS[number];
  const rawKind = String(body.kind ?? "discussion");
  const kind: DiscussionKind = VALID_KINDS.includes(rawKind as DiscussionKind) ? rawKind as DiscussionKind : "discussion";
  const tags = Array.isArray(body.tags)
    ? (body.tags as unknown[]).slice(0, 10).map((t) => cap(String(t), 40))
    : [];
  const language = body.language ? cap(String(body.language), 40) : undefined;
  const questionId = body.questionId ? String(body.questionId) : undefined;

  if (!title.trim() || !content.trim()) {
    return NextResponse.json({ error: "Title and content required" }, { status: 400 });
  }

  await connectDB();
  const discussion = await Discussion.create({
    question: questionId,
    author: session.user.id,
    title: sanitizeUserContent(title),
    content: sanitizeUserContent(content),
    kind,
    tags: tags.map(sanitizeUserContent),
    language,
  });

  await discussion.populate("author", "username name image");
  return NextResponse.json({ discussion }, { status: 201 });
}
