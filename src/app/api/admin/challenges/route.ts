import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { challengeInputSchema } from "@/schemas/challenge";
import { adminListChallenges, createChallenge } from "@/services/challenges";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const challenges = await adminListChallenges();
  return NextResponse.json({ challenges });
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

  const parsed = challengeInputSchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json(
      {
        error: `Validation failed at ${issue?.path.join(".") || "(root)"}: ${issue?.message}`,
      },
      { status: 400 },
    );
  }

  try {
    const { id, slug } = await createChallenge({
      title: parsed.data.title,
      difficulty: parsed.data.difficulty,
      tech: parsed.data.tech,
      tags: parsed.data.tags,
      brief: parsed.data.brief,
      description: parsed.data.description,
      designSpec: parsed.data.designSpec,
      starterFiles: Object.entries(parsed.data.starterFiles).map(([path, code]) => ({ path, code })),
      checklist: parsed.data.checklist,
      isPublished: parsed.data.isPublished,
      createdBy: session.user.id,
    });
    return NextResponse.json({ id, slug }, { status: 201 });
  } catch (saveError) {
    return NextResponse.json(
      { error: saveError instanceof Error ? saveError.message : "Failed to save" },
      { status: 500 },
    );
  }
}
