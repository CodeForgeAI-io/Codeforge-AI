import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireUser } from "@/lib/api-auth";
import { Discussion } from "@/models";

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
  if (q) filter.title = { $regex: q, $options: "i" };

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

  const body = await req.json();
  const { questionId, title, content, kind = "discussion", tags = [], language } = body;

  if (!title?.trim() || !content?.trim()) {
    return NextResponse.json({ error: "Title and content required" }, { status: 400 });
  }

  await connectDB();
  const discussion = await Discussion.create({
    question: questionId ?? undefined,
    author: session.user.id,
    title: title.trim(),
    content: content.trim(),
    kind,
    tags,
    language,
  });

  await discussion.populate("author", "username name image");
  return NextResponse.json({ discussion }, { status: 201 });
}
