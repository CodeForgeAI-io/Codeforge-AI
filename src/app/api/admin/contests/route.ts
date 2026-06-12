import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/api-auth";
import { Contest, Question } from "@/models";
import { contestInputSchema } from "@/schemas/contest";
import { uniqueSlug } from "@/lib/slug";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  await connectDB();
  const contests = await Contest.find()
    .sort({ startsAt: -1 })
    .limit(100)
    .select("slug title type startsAt durationMinutes isPublished participants questions")
    .lean();

  return NextResponse.json({
    contests: contests.map((contest) => ({
      id: contest._id.toString(),
      slug: contest.slug,
      title: contest.title,
      type: contest.type,
      startsAt: contest.startsAt,
      durationMinutes: contest.durationMinutes,
      isPublished: contest.isPublished,
      participantCount: contest.participants.length,
      questionCount: contest.questions.length,
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

  await connectDB();

  // Every referenced question must exist and be published
  const ids = parsed.data.questions.map((q) => new Types.ObjectId(q.questionId));
  const found = await Question.countDocuments({
    _id: { $in: ids },
    isPublished: true,
  });
  if (found !== ids.length) {
    return NextResponse.json(
      { error: "One or more question ids are missing or unpublished" },
      { status: 400 },
    );
  }

  const slug = await uniqueSlug(parsed.data.title, async (candidate) =>
    Boolean(await Contest.exists({ slug: candidate })),
  );
  const contest = await Contest.create({
    title: parsed.data.title,
    description: parsed.data.description,
    type: parsed.data.type,
    startsAt: parsed.data.startsAt,
    durationMinutes: parsed.data.durationMinutes,
    questions: parsed.data.questions.map((q) => ({
      question: new Types.ObjectId(q.questionId),
      points: q.points,
    })),
    isPublished: parsed.data.isPublished,
    slug,
    createdBy: session.user.id,
  });

  return NextResponse.json(
    { id: contest._id.toString(), slug: contest.slug },
    { status: 201 },
  );
}
