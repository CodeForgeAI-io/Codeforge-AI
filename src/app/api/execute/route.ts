import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireUser } from "@/lib/api-auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getLanguage } from "@/lib/constants";
import { Question } from "@/models";
import { runRequestSchema } from "@/schemas/execution";
import { runTestSuite } from "@/services/execution";

export const maxDuration = 60;

/** Run code against visible sample tests or a custom input. Nothing persists. */
export async function POST(req: NextRequest) {
  const { session, error } = await requireUser();
  if (error) return error;

  const limited = await enforceRateLimit("execute", req, session.user.id);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = runRequestSchema.safeParse(body);
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
  })
    .select("testCases")
    .lean();
  if (!question) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  const tests =
    parsed.data.customInput !== undefined
      ? [{ input: parsed.data.customInput, expected: "", hidden: false }]
      : question.testCases
          .filter((tc) => !tc.hidden)
          .map((tc) => ({
            input: tc.input,
            expected: tc.expected,
            hidden: false,
          }));

  if (tests.length === 0) {
    return NextResponse.json(
      { error: "This question has no visible test cases to run" },
      { status: 400 },
    );
  }

  const suite = await runTestSuite(language, parsed.data.code, tests);
  const isCustomRun = parsed.data.customInput !== undefined;

  return NextResponse.json({
    custom: isCustomRun,
    results: suite.results.map((r) => ({
      input: r.input,
      expected: isCustomRun ? null : r.expected,
      actual: r.actual,
      passed: isCustomRun ? null : r.passed,
      stderr: r.stderr,
      timeMs: r.timeMs,
      status: r.status,
    })),
    passedCount: suite.passedCount,
    totalCount: suite.totalCount,
    totalTimeMs: suite.totalTimeMs,
  });
}
