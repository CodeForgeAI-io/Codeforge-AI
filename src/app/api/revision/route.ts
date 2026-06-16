import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireUser } from "@/lib/api-auth";
import { SpacedRepetition, Submission } from "@/models";

function sm2(quality: number, repetitions: number, easeFactor: number, interval: number) {
  let ef = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (ef < 1.3) ef = 1.3;

  let reps = repetitions;
  let newInterval = interval;

  if (quality >= 3) {
    if (reps === 0) newInterval = 1;
    else if (reps === 1) newInterval = 6;
    else newInterval = Math.round(interval * ef);
    reps++;
  } else {
    reps = 0;
    newInterval = 1;
  }

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + newInterval);

  return { interval: newInterval, repetitions: reps, easeFactor: ef, nextReview };
}

export async function GET() {
  const { session, error } = await requireUser();
  if (error) return error;

  await connectDB();
  const now = new Date();

  const dueCards = await SpacedRepetition.find({
    user: session.user.id,
    nextReview: { $lte: now },
  })
    .populate("question", "slug title difficulty category")
    .sort({ nextReview: 1 })
    .limit(20)
    .lean();

  const upcoming = await SpacedRepetition.find({
    user: session.user.id,
    nextReview: { $gt: now },
  })
    .sort({ nextReview: 1 })
    .limit(10)
    .populate("question", "slug title difficulty")
    .lean();

  return NextResponse.json({ due: dueCards, upcoming, dueCount: dueCards.length });
}

export async function POST(req: NextRequest) {
  const { session, error } = await requireUser();
  if (error) return error;

  const { questionId, quality } = await req.json();
  if (!questionId || quality === undefined) {
    return NextResponse.json({ error: "questionId and quality required" }, { status: 400 });
  }

  await connectDB();

  let card = await SpacedRepetition.findOne({ user: session.user.id, question: questionId });

  if (!card) {
    card = await SpacedRepetition.create({
      user: session.user.id,
      question: questionId,
    });
  }

  const { interval, repetitions, easeFactor, nextReview } = sm2(
    quality,
    card.repetitions,
    card.easeFactor,
    card.interval,
  );

  card.interval = interval;
  card.repetitions = repetitions;
  card.easeFactor = easeFactor;
  card.nextReview = nextReview;
  card.lastReview = new Date();
  await card.save();

  return NextResponse.json({ card });
}

export async function PUT(req: NextRequest) {
  const { session, error } = await requireUser();
  if (error) return error;

  const { questionId } = await req.json();
  if (!questionId) return NextResponse.json({ error: "questionId required" }, { status: 400 });

  await connectDB();
  await SpacedRepetition.findOneAndUpdate(
    { user: session.user.id, question: questionId },
    { $setOnInsert: { user: session.user.id, question: questionId } },
    { upsert: true, returnDocument: 'after' },
  );

  return NextResponse.json({ ok: true });
}
