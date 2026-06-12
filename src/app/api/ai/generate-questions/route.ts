import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import { requireUser } from "@/lib/api-auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { DIFFICULTIES, QUESTION_CATEGORIES } from "@/lib/constants";
import { isAiConfigured } from "@/services/ai/groq";
import { generateQuestionsFromPrompt } from "@/services/ai/generate-questions";

export const maxDuration = 120;

const userGenerateSchema = z.object({
  prompt: z.string().min(10).max(600),
  count: z.coerce.number().int().min(1).max(5).default(3),
  category: z.enum(QUESTION_CATEGORIES).optional(),
  difficulty: z.enum(DIFFICULTIES).optional(),
});

/**
 * Any signed-in user can generate practice questions from a prompt.
 * Generated questions are published immediately so they appear in
 * /problems for everyone, properly categorized.
 */
export async function POST(req: NextRequest) {
  const { session, error } = await requireUser();
  if (error) return error;

  if (!isAiConfigured()) {
    return NextResponse.json(
      {
        error:
          "AI generation requires GROQ_API_KEY (free key at console.groq.com).",
      },
      { status: 503 },
    );
  }

  const limited = await enforceRateLimit("aiGenerate", req, session.user.id);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = userGenerateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
    );
  }

  const constraints = [
    parsed.data.difficulty && `All questions must be ${parsed.data.difficulty} difficulty.`,
    parsed.data.category && `All questions must use the category "${parsed.data.category}".`,
  ]
    .filter(Boolean)
    .join(" ");

  await connectDB();
  try {
    const outcome = await generateQuestionsFromPrompt(
      `${parsed.data.prompt}. ${constraints}`.trim(),
      parsed.data.count,
      session.user.id,
      { publish: true },
    );
    return NextResponse.json(outcome, { status: 201 });
  } catch (generationError) {
    return NextResponse.json(
      {
        error:
          generationError instanceof Error
            ? generationError.message
            : "Generation failed",
      },
      { status: 502 },
    );
  }
}
