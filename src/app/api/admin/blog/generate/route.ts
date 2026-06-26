import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { isAiConfigured } from "@/services/ai/groq";
import { generateBlogFromScreenshot } from "@/services/ai/blog-from-screenshot";

export const runtime = "nodejs";
export const maxDuration = 120;

/** Vision: turn a feature screenshot into a draft blog post (admin). */
export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  if (!isAiConfigured()) {
    return NextResponse.json(
      { error: "AI is not configured. Add GROQ_API_KEY (and optionally GROQ_VISION_MODEL)." },
      { status: 503 },
    );
  }

  let body: { image?: string; hint?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const image = body.image ?? "";
  if (!image.startsWith("data:image/")) {
    return NextResponse.json({ error: "A screenshot image is required" }, { status: 400 });
  }

  try {
    const generated = await generateBlogFromScreenshot(image, body.hint);
    return NextResponse.json({ generated });
  } catch (e) {
    console.error("[blog/generate]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Generation failed" },
      { status: 502 },
    );
  }
}
