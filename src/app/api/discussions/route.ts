import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireUser } from "@/lib/api-auth";
import { Discussion } from "@/models";
import { escapeRegex, sanitizeUserContent, cap } from "@/lib/sanitize";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { backendFor } from "@/lib/data-backend";
import { pingIndexNow } from "@/lib/indexnow";
import {
  DISCUSSION_LIST_COLS,
  DISCUSSION_FULL_COLS,
  fetchAuthors,
  listShape,
  detailShape,
  type SbDiscussionRow,
} from "@/services/discussions-store";

const be = () => backendFor("discussions");

export async function GET(req: NextRequest) {
  const questionId = req.nextUrl.searchParams.get("question") ?? undefined;
  const kind = req.nextUrl.searchParams.get("kind") ?? undefined;
  const page = Math.max(1, Number(req.nextUrl.searchParams.get("page") ?? 1));
  const limit = 20;
  const q = req.nextUrl.searchParams.get("q") ?? undefined;

  if (be() === "supabase") {
    const sb = supabaseAdmin();
    let query = sb
      .from("discussions")
      .select(DISCUSSION_LIST_COLS, { count: "exact" })
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);
    if (questionId) query = query.eq("question_id", questionId);
    if (kind) query = query.eq("kind", kind);
    if (q) query = query.ilike("title", `%${q}%`);
    const { data, count, error: qErr } = await query;
    if (qErr) return NextResponse.json({ error: qErr.message }, { status: 500 });
    const rows = (data ?? []) as SbDiscussionRow[];
    const authors = await fetchAuthors(rows.map((r) => r.author_id ?? "").filter(Boolean));
    const discussions = rows.map((r) => listShape(r, authors));
    const total = count ?? 0;
    return NextResponse.json({ discussions, total, page, pages: Math.ceil(total / limit) });
  }

  await connectDB();
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

  const cleanTitle = sanitizeUserContent(title);
  const cleanContent = sanitizeUserContent(content);
  const cleanTags = tags.map(sanitizeUserContent);

  if (be() === "supabase") {
    const { data, error: insErr } = await supabaseAdmin()
      .from("discussions")
      .insert({
        question_id: questionId ?? null,
        author_id: session.user.id,
        title: cleanTitle,
        content: cleanContent,
        kind,
        tags: cleanTags,
        language: language ?? null,
        upvotes: [],
        downvotes: [],
        replies: [],
      })
      .select(DISCUSSION_FULL_COLS)
      .single();
    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });
    const row = data as SbDiscussionRow;
    const authors = await fetchAuthors([row.author_id ?? ""].filter(Boolean));
    await pingIndexNow(`/forum/${row.id}`);
    return NextResponse.json({ discussion: detailShape(row, authors) }, { status: 201 });
  }

  await connectDB();
  const discussion = await Discussion.create({
    question: questionId,
    author: session.user.id,
    title: cleanTitle,
    content: cleanContent,
    kind,
    tags: cleanTags,
    language,
  });

  await discussion.populate("author", "username name image");
  await pingIndexNow(`/forum/${discussion._id}`);
  return NextResponse.json({ discussion }, { status: 201 });
}
