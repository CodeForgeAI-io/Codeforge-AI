import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/api-auth";
import { FrontendChallenge } from "@/models";
import { challengeInputSchema } from "@/schemas/challenge";
import { recordToFiles } from "@/services/challenges";
import { uniqueSlug } from "@/lib/slug";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  await connectDB();
  const challenges = await FrontendChallenge.find()
    .sort({ createdAt: -1 })
    .limit(200)
    .select("slug title difficulty tech isPublished stats createdAt")
    .lean();

  return NextResponse.json({
    challenges: challenges.map((challenge) => ({
      id: challenge._id.toString(),
      slug: challenge.slug,
      title: challenge.title,
      difficulty: challenge.difficulty,
      tech: challenge.tech,
      isPublished: challenge.isPublished,
      attempts: challenge.stats.attempts,
      createdAt: challenge.createdAt,
    })),
  });
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

  await connectDB();
  try {
    const slug = await uniqueSlug(parsed.data.title, async (candidate) =>
      Boolean(await FrontendChallenge.exists({ slug: candidate })),
    );
    const challenge = await FrontendChallenge.create({
      ...parsed.data,
      starterFiles: recordToFiles(parsed.data.starterFiles),
      slug,
      createdBy: session.user.id,
    });

    return NextResponse.json(
      { id: challenge._id.toString(), slug: challenge.slug },
      { status: 201 },
    );
  } catch (saveError) {
    return NextResponse.json(
      {
        error:
          saveError instanceof Error ? saveError.message : "Failed to save",
      },
      { status: 500 },
    );
  }
}
