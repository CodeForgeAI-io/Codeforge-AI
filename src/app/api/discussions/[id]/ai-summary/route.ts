import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireUser } from "@/lib/api-auth";
import { Discussion } from "@/models";
import { getGroqClient } from "@/services/ai/groq";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireUser();
  if (error) return error;

  const { id } = await params;
  await connectDB();

  const discussion = await Discussion.findById(id).lean();
  if (!discussion) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const replies = discussion.replies.map((r) => r.content).join("\n---\n");
  const prompt = `Summarize this coding discussion in 3-4 concise bullet points. Focus on key insights, solutions mentioned, and consensus.\n\nTitle: ${discussion.title}\n\nMain post: ${discussion.content}\n\nReplies:\n${replies || "No replies yet."}`;

  const groq = getGroqClient();
  const completion = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 300,
  });

  const summary = completion.choices[0]?.message?.content ?? "";
  await Discussion.findByIdAndUpdate(id, { aiSummary: summary, aiSummaryAt: new Date() });

  return NextResponse.json({ summary });
}
