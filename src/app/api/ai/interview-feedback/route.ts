import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { enforceAiCredit } from "@/services/ai-credits";
import { requireFeature } from "@/services/feature-access";
import { enforceRateLimit } from "@/lib/rate-limit";
import { interviewFeedbackSchema } from "@/schemas/ai";
import { complete, isAiConfigured } from "@/services/ai/groq";
import { getPrompt } from "@/services/ai/prompts";
import { getPostHogServer } from "@/lib/posthog-server";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { session, error } = await requireUser();
  if (error) return error;

  const gate = await requireFeature(session.user.plan, "mockInterview");
  if (gate) return gate;
  const credit = await enforceAiCredit(session.user.id, session.user.plan);
  if (credit) return credit;

  if (!isAiConfigured()) {
    return NextResponse.json(
      {
        error:
          "AI feedback requires GROQ_API_KEY. Your session stats are still saved in your submissions.",
      },
      { status: 503 },
    );
  }

  const limited = await enforceRateLimit("ai", req, session.user.id);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = interviewFeedbackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
    );
  }

  const sessionSummary = parsed.data.questions
    .map(
      (question, index) =>
        `Question ${index + 1}: "${question.title}" (${question.difficulty})\n` +
        `Solved: ${question.solved ? "yes" : "no"} · Time spent: ${Math.round(question.timeSpentSeconds / 60)} min\n` +
        (question.code
          ? `Final code (${question.language ?? "unknown"}):\n\`\`\`\n${question.code.slice(0, 4000)}\n\`\`\``
          : "No code written."),
    )
    .join("\n\n");

  const prompt = await getPrompt("interview-feedback", {
    session: `Topic focus: ${parsed.data.topic}\nSession length: ${parsed.data.durationMinutes} minutes\n\n${sessionSummary}`,
  });

  const report = await complete(
    [
      { role: "system", content: prompt.text },
      { role: "user", content: "Write my interview performance report now." },
    ],
    { temperature: prompt.temperature, maxTokens: prompt.maxTokens },
  );

  const posthog = getPostHogServer();
  posthog?.capture({
    distinctId: session.user.id,
    event: "interview_feedback_requested",
    properties: {
      topic: parsed.data.topic,
      duration_minutes: parsed.data.durationMinutes,
      questions_count: parsed.data.questions.length,
      solved_count: parsed.data.questions.filter((q) => q.solved).length,
    },
  });

  return NextResponse.json({ report });
}
