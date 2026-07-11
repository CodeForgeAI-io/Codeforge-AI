import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { isAiConfigured } from "@/services/ai/groq";
import { generateNewsletter } from "@/services/ai/newsletter";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Draft a newsletter (subject + HTML body) from a prompt. Admin only. */
export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  if (!isAiConfigured()) {
    return NextResponse.json(
      { error: "AI is not configured. Add GROQ_API_KEY to enable drafting." },
      { status: 503 },
    );
  }

  let body: { prompt?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const prompt = (body.prompt ?? "").trim().slice(0, 500);
  if (prompt.length < 3) {
    return NextResponse.json({ error: "Describe what the newsletter should be about." }, { status: 400 });
  }

  try {
    const generated = await generateNewsletter(prompt);
    return NextResponse.json({ generated });
  } catch (e) {
    console.error("[newsletter/generate]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Generation failed" },
      { status: 502 },
    );
  }
}
