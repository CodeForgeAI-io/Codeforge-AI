import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { requireUser } from "@/lib/api-auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getLanguage, type Difficulty } from "@/lib/constants";
import { Contest, Question, Submission } from "@/models";
import { submitRequestSchema } from "@/schemas/execution";
import { runTestSuite, suiteToSubmissionStatus } from "@/services/execution";
import { getDailyChallenge } from "@/services/contests";
import { XP_DAILY_CHALLENGE_BONUS } from "@/lib/constants";
import {
  recordAcceptedSolve,
  recordDailyActivity,
  awardContestBadge,
} from "@/services/gamification";

export const maxDuration = 120;

/** Full submission: all test cases (incl. hidden), persisted, awards XP. */
export async function POST(req: NextRequest) {
  const { session, error } = await requireUser();
  if (error) return error;

  const limited = await enforceRateLimit("submit", req, session.user.id);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = submitRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
    );
  }

  const language = getLanguage(parsed.data.language);
  if (!language) {
    return NextResponse.json({ error: "Unsupported language" }, { status: 400 });
  }

  await connectDB();
  const question = await Question.findOne({
    _id: parsed.data.questionId,
    isPublished: true,
  }).lean();
  if (!question) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  const suite = await runTestSuite(
    language,
    parsed.data.code,
    question.testCases,
  );
  const status = suiteToSubmissionStatus(suite);
  const accepted = status === "Accepted";

  const priorAccepted = await Submission.exists({
    user: new Types.ObjectId(session.user.id),
    question: question._id,
    status: "Accepted",
  });
  const firstAccept = accepted && !priorAccepted;

  // Contest scoring (when submitted from a live contest arena)
  let contestId: Types.ObjectId | undefined;
  if (parsed.data.contestSlug) {
    const contest = await Contest.findOne({
      slug: parsed.data.contestSlug,
      isPublished: true,
    });
    const now = Date.now();
    const entry = contest?.questions.find(
      (q) => q.question.toString() === question._id.toString(),
    );
    if (
      contest &&
      entry &&
      now >= contest.startsAt.getTime() &&
      now <= contest.startsAt.getTime() + contest.durationMinutes * 60_000
    ) {
      contestId = contest._id;
      const participant = contest.participants.find(
        (p) => p.user.toString() === session.user.id,
      );
      if (
        participant &&
        accepted &&
        !participant.solvedQuestionIds.includes(question._id.toString())
      ) {
        participant.solvedQuestionIds.push(question._id.toString());
        participant.score += entry.points;
        participant.penaltySeconds += Math.floor(
          (now - contest.startsAt.getTime()) / 1000,
        );
        await contest.save();
        await awardContestBadge(new Types.ObjectId(session.user.id));
      }
    }
  }

  const submission = await Submission.create({
    user: new Types.ObjectId(session.user.id),
    kind: "dsa",
    question: question._id,
    contest: contestId,
    language: language.id,
    code: parsed.data.code,
    status,
    testResults: suite.results.map((r) => ({
      // hidden test inputs/outputs are not stored in cleartext detail
      input: r.hidden ? "[hidden]" : r.input,
      expected: r.hidden ? "[hidden]" : r.expected,
      actual: r.hidden ? (r.passed ? "[hidden]" : "[hidden — failed]") : r.actual,
      passed: r.passed,
      hidden: r.hidden,
      stderr: r.hidden ? "" : r.stderr,
      timeMs: r.timeMs ?? undefined,
    })),
    passedCount: suite.passedCount,
    totalCount: suite.totalCount,
    runtimeMs: suite.totalTimeMs,
    memoryKb: suite.maxMemoryKb ?? undefined,
  });

  await Question.updateOne(
    { _id: question._id },
    {
      $inc: {
        "stats.submissions": 1,
        "stats.accepted": accepted ? 1 : 0,
      },
    },
  );

  let rewards = null;
  await recordDailyActivity(session.user.id, accepted);
  if (accepted) {
    // Solving today's daily challenge grants bonus XP
    const daily = await getDailyChallenge().catch(() => null);
    const isDaily = daily?.id === question._id.toString();
    rewards = await recordAcceptedSolve({
      userId: session.user.id,
      kind: "dsa",
      difficulty: question.difficulty as Difficulty,
      firstAccept,
      xpBonus: isDaily && firstAccept ? XP_DAILY_CHALLENGE_BONUS : 0,
      tags: [...question.tags, question.category],
    });
  }

  return NextResponse.json({
    submissionId: submission._id.toString(),
    status,
    passedCount: suite.passedCount,
    totalCount: suite.totalCount,
    runtimeMs: suite.totalTimeMs,
    results: submission.testResults,
    rewards,
  });
}

/** List the signed-in user's submissions, optionally for one question */
export async function GET(req: NextRequest) {
  const { session, error } = await requireUser();
  if (error) return error;

  await connectDB();
  const questionId = req.nextUrl.searchParams.get("questionId");
  const query: Record<string, unknown> = {
    user: new Types.ObjectId(session.user.id),
  };
  if (questionId && Types.ObjectId.isValid(questionId)) {
    query.question = new Types.ObjectId(questionId);
  }

  interface SubmissionLean {
    _id: { toString(): string };
    status: string;
    language?: string;
    passedCount: number;
    totalCount: number;
    runtimeMs?: number;
    createdAt: Date;
    code?: string;
  }

  const submissions = (await Submission.find(query)
    .sort({ createdAt: -1 })
    .limit(20)
    .select("status language passedCount totalCount runtimeMs createdAt code")
    .lean()) as unknown as SubmissionLean[];

  return NextResponse.json({
    submissions: submissions.map((s) => ({
      id: s._id.toString(),
      status: s.status,
      language: s.language,
      passedCount: s.passedCount,
      totalCount: s.totalCount,
      runtimeMs: s.runtimeMs ?? null,
      createdAt: s.createdAt,
      code: s.code,
    })),
  });
}
