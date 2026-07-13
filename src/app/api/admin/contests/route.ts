import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { contestInputSchema } from "@/schemas/contest";
import { adminListContests, countPublishedQuestions, createContest } from "@/services/contests";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const contests = await adminListContests();
  return NextResponse.json({ contests });
}

export async function POST(req: NextRequest) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = contestInputSchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json(
      {
        error: `Validation failed at ${issue?.path.join(".") || "(root)"}: ${issue?.message}`,
      },
      { status: 400 },
    );
  }

  // Every referenced question must exist and be published
  const ids = parsed.data.questions.map((q) => q.questionId);
  const found = await countPublishedQuestions(ids);
  if (found !== ids.length) {
    return NextResponse.json(
      { error: "One or more question ids are missing or unpublished" },
      { status: 400 },
    );
  }

  const { id, slug } = await createContest({
    title: parsed.data.title,
    description: parsed.data.description,
    type: parsed.data.type,
    startsAt: parsed.data.startsAt,
    durationMinutes: parsed.data.durationMinutes,
    questions: parsed.data.questions,
    isPublished: parsed.data.isPublished,
    createdBy: session.user.id,
  });

  return NextResponse.json({ id, slug }, { status: 201 });
}
