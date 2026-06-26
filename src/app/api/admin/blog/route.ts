import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/api-auth";
import { BlogPost } from "@/models";
import { uniqueSlug } from "@/lib/slug";

export const runtime = "nodejs";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  await connectDB();
  // Exclude the heavy cover blob from the list.
  const posts = await BlogPost.find()
    .select("-coverData")
    .sort({ createdAt: -1 })
    .limit(300)
    .lean();

  return NextResponse.json({
    posts: posts.map((p) => ({
      id: p._id.toString(),
      slug: p.slug,
      title: p.title,
      description: p.description,
      tags: p.tags,
      status: p.status,
      views: p.views,
      coverMime: p.coverMime,
      publishedAt: p.publishedAt ?? null,
      createdAt: p.createdAt,
    })),
  });
}

/** Split a data URL into mime + raw base64. */
function parseDataUrl(dataUrl: string): { mime: string; data: string } | null {
  const m = /^data:(image\/[a-zA-Z+]+);base64,(.+)$/.exec(dataUrl);
  if (!m) return null;
  return { mime: m[1], data: m[2] };
}

export async function POST(req: NextRequest) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const title = String(body.title ?? "").trim();
  if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

  const cover = parseDataUrl(String(body.coverImage ?? ""));
  if (!cover) return NextResponse.json({ error: "A cover image is required" }, { status: 400 });

  await connectDB();
  const slug = await uniqueSlug(title, async (s) => !!(await BlogPost.exists({ slug: s })));

  const status = body.status === "published" ? "published" : "draft";
  const tags = Array.isArray(body.tags)
    ? body.tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean).slice(0, 8)
    : [];

  const post = await BlogPost.create({
    slug,
    title: title.slice(0, 160),
    description: String(body.description ?? "").slice(0, 300),
    content: String(body.content ?? ""),
    tags,
    seoTitle: String(body.seoTitle ?? "").slice(0, 70),
    seoDescription: String(body.seoDescription ?? "").slice(0, 200),
    seoKeywords: String(body.seoKeywords ?? "").slice(0, 300),
    coverData: cover.data,
    coverMime: cover.mime,
    author: session.user.id,
    status,
    publishedAt: status === "published" ? new Date() : null,
  });

  return NextResponse.json({ ok: true, id: post._id.toString(), slug }, { status: 201 });
}
