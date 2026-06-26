import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/api-auth";
import { BlogPost } from "@/models";

export const runtime = "nodejs";

function parseDataUrl(dataUrl: string): { mime: string; data: string } | null {
  const m = /^data:(image\/[a-zA-Z+]+);base64,(.+)$/.exec(dataUrl);
  if (!m) return null;
  return { mime: m[1], data: m[2] };
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  if (typeof body.title === "string") update.title = body.title.slice(0, 160);
  if (typeof body.description === "string") update.description = body.description.slice(0, 300);
  if (typeof body.content === "string") update.content = body.content;
  if (Array.isArray(body.tags)) update.tags = body.tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean).slice(0, 8);
  if (typeof body.seoTitle === "string") update.seoTitle = body.seoTitle.slice(0, 70);
  if (typeof body.seoDescription === "string") update.seoDescription = body.seoDescription.slice(0, 200);
  if (typeof body.seoKeywords === "string") update.seoKeywords = body.seoKeywords.slice(0, 300);
  if (typeof body.coverImage === "string" && body.coverImage.startsWith("data:image/")) {
    const cover = parseDataUrl(body.coverImage);
    if (cover) { update.coverData = cover.data; update.coverMime = cover.mime; }
  }
  if (body.status === "draft" || body.status === "published") {
    update.status = body.status;
    if (body.status === "published") {
      const existing = await BlogPost.findById(id).select("publishedAt").lean();
      if (existing && !existing.publishedAt) update.publishedAt = new Date();
    }
  }

  await connectDB();
  const res = await BlogPost.updateOne({ _id: id }, { $set: update });
  if (res.matchedCount === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  await connectDB();
  await BlogPost.deleteOne({ _id: id });
  return NextResponse.json({ ok: true });
}
