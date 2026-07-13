import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { adminListPosts, createBlogPost } from "@/services/blog-store";

export const runtime = "nodejs";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const posts = await adminListPosts(300);
  return NextResponse.json({
    posts: posts.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      description: p.description,
      tags: p.tags,
      status: p.status,
      views: p.views,
      coverMime: p.coverMime,
      publishedAt: p.publishedAt,
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

  const status = body.status === "published" ? "published" : "draft";
  const tags = Array.isArray(body.tags)
    ? body.tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean).slice(0, 8)
    : [];

  const { id, slug } = await createBlogPost({
    title: title.slice(0, 160),
    description: String(body.description ?? "").slice(0, 300),
    content: String(body.content ?? ""),
    tags,
    seoTitle: String(body.seoTitle ?? "").slice(0, 70),
    seoDescription: String(body.seoDescription ?? "").slice(0, 200),
    seoKeywords: String(body.seoKeywords ?? "").slice(0, 300),
    coverData: cover.data,
    coverMime: cover.mime,
    authorId: session.user.id,
    status,
  });

  return NextResponse.json({ ok: true, id, slug }, { status: 201 });
}
