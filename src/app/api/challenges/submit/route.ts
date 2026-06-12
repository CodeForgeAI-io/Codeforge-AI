import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { requireUser } from "@/lib/api-auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { FrontendChallenge, Submission } from "@/models";
import { challengeSubmitSchema } from "@/schemas/challenge";
import { recordToFiles } from "@/services/challenges";
import { complete, isAiConfigured } from "@/services/ai/groq";
import { getPrompt } from "@/services/ai/prompts";
import {
  recordAcceptedSolve,
  recordDailyActivity,
} from "@/services/gamification";
import type { Difficulty } from "@/lib/constants";

export const maxDuration = 60;

const PASS_SCORE = 70;

interface AiReview {
  score: number;
  verdict: "pass" | "fail";
  feedback: string;
}

function checklistFallback(
  checkedCount: number,
  totalCount: number,
): AiReview {
  const score =
    totalCount === 0 ? 100 : Math.round((checkedCount / totalCount) * 100);
  return {
    score,
    verdict: score >= PASS_SCORE ? "pass" : "fail",
    feedback:
      "AI review is not configured (set GROQ_API_KEY for detailed feedback). " +
      `Scored from your self-assessment checklist: ${checkedCount}/${totalCount} requirements marked complete.`,
  };
}

export async function POST(req: NextRequest) {
  const { session, error } = await requireUser();
  if (error) return error;

  const limited = await enforceRateLimit("ai", req, session.user.id);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = challengeSubmitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
    );
  }

  await connectDB();
  const challenge = await FrontendChallenge.findOne({
    _id: parsed.data.challengeId,
    isPublished: true,
  }).lean();
  if (!challenge) {
    return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
  }

  // Grade the submission
  let review: AiReview;
  if (isAiConfigured()) {
    const filesBlock = Object.entries(parsed.data.files)
      .map(([path, content]) => `--- ${path} ---\n${content.slice(0, 12_000)}`)
      .join("\n\n");
    const prompt = await getPrompt("frontend-review", {
      spec: `${challenge.title} (${challenge.difficulty}, ${challenge.tech})\n\n${challenge.designSpec}\n\nChecklist:\n${challenge.checklist.map((item) => `- ${item}`).join("\n")}`,
    });
    try {
      const raw = await complete(
        [
          { role: "system", content: prompt.text },
          { role: "user", content: `Submitted files:\n\n${filesBlock}` },
        ],
        {
          temperature: prompt.temperature,
          maxTokens: prompt.maxTokens,
          json: true,
        },
      );
      const parsedReview = JSON.parse(raw) as Partial<AiReview>;
      const score = Math.max(0, Math.min(100, Number(parsedReview.score) || 0));
      review = {
        score,
        verdict: score >= PASS_SCORE ? "pass" : "fail",
        feedback:
          typeof parsedReview.feedback === "string"
            ? parsedReview.feedback
            : "No feedback returned.",
      };
    } catch {
      review = checklistFallback(
        parsed.data.checkedItems.length,
        challenge.checklist.length,
      );
    }
  } else {
    review = checklistFallback(
      parsed.data.checkedItems.length,
      challenge.checklist.length,
    );
  }

  const accepted = review.verdict === "pass";
  const priorAccepted = await Submission.exists({
    user: new Types.ObjectId(session.user.id),
    challenge: challenge._id,
    status: "Accepted",
  });

  await Submission.create({
    user: new Types.ObjectId(session.user.id),
    kind: "frontend",
    challenge: challenge._id,
    files: recordToFiles(parsed.data.files),
    status: accepted ? "Accepted" : "Wrong Answer",
    passedCount: accepted ? 1 : 0,
    totalCount: 1,
    aiReview: { score: review.score, feedback: review.feedback },
  });

  await FrontendChallenge.updateOne(
    { _id: challenge._id },
    {
      $inc: {
        "stats.attempts": 1,
        "stats.completed": accepted ? 1 : 0,
      },
    },
  );

  let rewards = null;
  await recordDailyActivity(session.user.id, accepted);
  if (accepted) {
    rewards = await recordAcceptedSolve({
      userId: session.user.id,
      kind: "frontend",
      difficulty: challenge.difficulty as Difficulty,
      firstAccept: accepted && !priorAccepted,
      tags: [challenge.tech, ...challenge.tags],
    });
  }

  return NextResponse.json({
    score: review.score,
    verdict: review.verdict,
    feedback: review.feedback,
    rewards,
  });
}
