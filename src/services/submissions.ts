import { Types } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { Question, Submission, type QuestionTestCase } from "@/models";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { backendFor } from "@/lib/data-backend";

const be = () => backendFor("submissions");

export interface SubmittableQuestion {
  id: string;
  testCases: QuestionTestCase[];
  difficulty: string;
  tags: string[];
  category: string;
}

/** Fetch a published question's data needed to run + score a submission. */
export async function getSubmittableQuestion(
  questionId: string,
): Promise<SubmittableQuestion | null> {
  if (be() === "supabase") {
    const { data } = await supabaseAdmin()
      .from("questions")
      .select("id,test_cases,difficulty,tags,category")
      .eq("id", questionId)
      .eq("is_published", true)
      .maybeSingle();
    if (!data) return null;
    const q = data as {
      id: string;
      test_cases: QuestionTestCase[] | null;
      difficulty: string;
      tags: string[] | null;
      category: string;
    };
    return {
      id: q.id,
      testCases: q.test_cases ?? [],
      difficulty: q.difficulty,
      tags: q.tags ?? [],
      category: q.category,
    };
  }
  if (!Types.ObjectId.isValid(questionId)) return null;
  await connectDB();
  const doc = await Question.findOne({ _id: questionId, isPublished: true }).lean();
  if (!doc) return null;
  return {
    id: doc._id.toString(),
    testCases: doc.testCases,
    difficulty: doc.difficulty,
    tags: doc.tags,
    category: doc.category,
  };
}

/** Whether the user has an accepted submission for this question already. */
export async function hasPriorAccepted(
  userId: string,
  questionId: string,
): Promise<boolean> {
  if (be() === "supabase") {
    const { data } = await supabaseAdmin()
      .from("submissions")
      .select("id")
      .eq("user_id", userId)
      .eq("question_id", questionId)
      .eq("status", "Accepted")
      .limit(1)
      .maybeSingle();
    return Boolean(data);
  }
  await connectDB();
  return Boolean(
    await Submission.exists({
      user: new Types.ObjectId(userId),
      question: new Types.ObjectId(questionId),
      status: "Accepted",
    }),
  );
}

export interface StoredTestResult {
  input: string;
  expected: string;
  actual: string;
  passed: boolean;
  hidden: boolean;
  stderr: string;
  timeMs?: number;
}

export interface CreateDsaSubmission {
  userId: string;
  questionId: string;
  contestId?: string | null;
  language: string;
  code: string;
  status: string;
  testResults: StoredTestResult[];
  passedCount: number;
  totalCount: number;
  runtimeMs: number;
  memoryKb?: number;
}

/** Persist a DSA submission. Returns its id and the stored results. */
export async function createDsaSubmission(
  input: CreateDsaSubmission,
): Promise<{ id: string; testResults: StoredTestResult[] }> {
  if (be() === "supabase") {
    const { data, error } = await supabaseAdmin()
      .from("submissions")
      .insert({
        user_id: input.userId,
        kind: "dsa",
        question_id: input.questionId,
        contest_id: input.contestId ?? null,
        language: input.language,
        code: input.code,
        status: input.status,
        test_results: input.testResults,
        passed_count: input.passedCount,
        total_count: input.totalCount,
        runtime_ms: input.runtimeMs,
        memory_kb: input.memoryKb ?? null,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: (data as { id: string }).id, testResults: input.testResults };
  }
  await connectDB();
  const submission = new Submission({
    user: new Types.ObjectId(input.userId),
    kind: "dsa",
    question: new Types.ObjectId(input.questionId),
    contest: input.contestId ? new Types.ObjectId(input.contestId) : undefined,
    language: input.language,
    code: input.code,
    status: input.status,
    testResults: input.testResults,
    passedCount: input.passedCount,
    totalCount: input.totalCount,
    runtimeMs: input.runtimeMs,
    memoryKb: input.memoryKb,
  });
  await submission.save();
  return {
    id: submission._id.toString(),
    testResults: input.testResults,
  };
}

/** Atomically bump a question's submission/acceptance counters. */
export async function incrementQuestionStats(
  questionId: string,
  accepted: boolean,
): Promise<void> {
  if (be() === "supabase") {
    const { error } = await supabaseAdmin().rpc("increment_question_stats", {
      p_question: questionId,
      p_submissions: 1,
      p_accepted: accepted ? 1 : 0,
    });
    if (error) throw new Error(error.message);
    return;
  }
  await connectDB();
  await Question.updateOne(
    { _id: new Types.ObjectId(questionId) },
    { $inc: { "stats.submissions": 1, "stats.accepted": accepted ? 1 : 0 } },
  );
}

export interface UserSubmissionItem {
  id: string;
  status: string;
  language: string | null;
  passedCount: number;
  totalCount: number;
  runtimeMs: number | null;
  createdAt: string | Date;
  code: string | null;
}

/** List a user's recent submissions, optionally filtered to one question. */
export async function listUserSubmissions(
  userId: string,
  questionId?: string | null,
): Promise<UserSubmissionItem[]> {
  if (be() === "supabase") {
    let q = supabaseAdmin()
      .from("submissions")
      .select("id,status,language,passed_count,total_count,runtime_ms,created_at,code")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);
    if (questionId) q = q.eq("question_id", questionId);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return (
      (data ?? []) as {
        id: string;
        status: string;
        language: string | null;
        passed_count: number;
        total_count: number;
        runtime_ms: number | null;
        created_at: string;
        code: string | null;
      }[]
    ).map((s) => ({
      id: s.id,
      status: s.status,
      language: s.language,
      passedCount: s.passed_count,
      totalCount: s.total_count,
      runtimeMs: s.runtime_ms,
      createdAt: s.created_at,
      code: s.code,
    }));
  }
  await connectDB();
  const query: Record<string, unknown> = { user: new Types.ObjectId(userId) };
  if (questionId && Types.ObjectId.isValid(questionId)) {
    query.question = new Types.ObjectId(questionId);
  }
  const submissions = await Submission.find(query)
    .sort({ createdAt: -1 })
    .limit(20)
    .select("status language passedCount totalCount runtimeMs createdAt code")
    .lean();
  return submissions.map((s) => ({
    id: s._id.toString(),
    status: s.status,
    language: s.language ?? null,
    passedCount: s.passedCount,
    totalCount: s.totalCount,
    runtimeMs: s.runtimeMs ?? null,
    createdAt: s.createdAt,
    code: s.code ?? null,
  }));
}
