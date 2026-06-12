import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/api-auth";
import { Question } from "@/models";
import { questionImportSchema } from "@/schemas/question";
import { saveQuestionDraft } from "@/services/ai/generate-questions";

/** Admin: list ALL questions including unpublished drafts */
export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  await connectDB();
  const q = req.nextUrl.searchParams.get("q")?.trim();
  const query: Record<string, unknown> = {};
  if (q) query.title = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };

  const questions = await Question.find(query)
    .sort({ createdAt: -1 })
    .limit(200)
    .select("slug title difficulty category isPublished source stats createdAt")
    .lean();

  return NextResponse.json({
    questions: questions.map((question) => ({
      id: question._id.toString(),
      slug: question.slug,
      title: question.title,
      difficulty: question.difficulty,
      category: question.category,
      isPublished: question.isPublished,
      source: question.source,
      submissions: question.stats.submissions,
      createdAt: question.createdAt,
    })),
  });
}

/**
 * Admin: create question(s). Accepts a single question object or an array
 * (the JSON file upload posts its parsed contents here).
 */
export async function POST(req: NextRequest) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Convenience: accept `expected` written as `output` in test cases
  function normalize(input: unknown): unknown {
    if (Array.isArray(input)) return input.map(normalize);
    if (input && typeof input === "object") {
      const obj = { ...(input as Record<string, unknown>) };
      if (Array.isArray(obj.testCases)) {
        obj.testCases = obj.testCases.map((testCase) => {
          if (testCase && typeof testCase === "object") {
            const tc = { ...(testCase as Record<string, unknown>) };
            if (tc.expected === undefined && tc.output !== undefined) {
              tc.expected = tc.output;
              delete tc.output;
            }
            return tc;
          }
          return testCase;
        });
      }
      return obj;
    }
    return input;
  }

  const parsed = questionImportSchema.safeParse(normalize(body));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json(
      {
        error: `Validation failed at ${issue?.path.join(".") || "(root)"}: ${issue?.message}`,
      },
      { status: 400 },
    );
  }

  await connectDB();
  const items = Array.isArray(parsed.data) ? parsed.data : [parsed.data];
  const created: { slug: string; title: string }[] = [];
  const failed: { title: string; reason: string }[] = [];

  for (const item of items) {
    try {
      created.push(
        await saveQuestionDraft(
          item,
          session.user.id,
          Array.isArray(parsed.data) ? "json-import" : "manual",
        ),
      );
    } catch (saveError) {
      failed.push({
        title: item.title,
        reason: saveError instanceof Error ? saveError.message : "Save failed",
      });
    }
  }

  return NextResponse.json({ created, failed }, { status: 201 });
}
