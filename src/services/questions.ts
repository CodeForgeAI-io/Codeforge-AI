import { Types } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { mapToObject } from "@/lib/utils";
import { Question, Submission } from "@/models";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { backendFor } from "@/lib/data-backend";
import type { QuestionFilter } from "@/schemas/question";

const be = () => backendFor("questions");

/** Shape of the `stats` jsonb / Mongo subdoc used for acceptance rate. */
interface QStats {
  submissions?: number;
  accepted?: number;
}
function acceptanceRate(stats: QStats | null | undefined): number | null {
  const subs = stats?.submissions ?? 0;
  return subs > 0 ? Math.round(((stats?.accepted ?? 0) / subs) * 100) : null;
}

export interface QuestionListItem {
  id: string;
  slug: string;
  title: string;
  difficulty: string;
  category: string;
  tags: string[];
  companies: string[];
  acceptanceRate: number | null;
  status: "solved" | "attempted" | "todo";
}

export interface QuestionListResult {
  items: QuestionListItem[];
  total: number;
  page: number;
  hasMore: boolean;
}

/** Distinct question ids the user solved / attempted, as string sets */
export async function getUserQuestionStatuses(userId: string): Promise<{
  solved: Set<string>;
  attempted: Set<string>;
}> {
  if (be() === "supabase") {
    const sb = supabaseAdmin();
    const [acc, att] = await Promise.all([
      sb
        .from("submissions")
        .select("question_id")
        .eq("user_id", userId)
        .eq("kind", "dsa")
        .eq("status", "Accepted")
        .not("question_id", "is", null),
      sb
        .from("submissions")
        .select("question_id")
        .eq("user_id", userId)
        .eq("kind", "dsa")
        .not("question_id", "is", null),
    ]);
    if (acc.error) throw new Error(acc.error.message);
    if (att.error) throw new Error(att.error.message);
    return {
      solved: new Set((acc.data ?? []).map((r) => String(r.question_id))),
      attempted: new Set((att.data ?? []).map((r) => String(r.question_id))),
    };
  }
  const [solvedIds, attemptedIds] = await Promise.all([
    Submission.distinct("question", {
      user: new Types.ObjectId(userId),
      kind: "dsa",
      status: "Accepted",
    }),
    Submission.distinct("question", {
      user: new Types.ObjectId(userId),
      kind: "dsa",
    }),
  ]);
  return {
    solved: new Set(solvedIds.map(String)),
    attempted: new Set(attemptedIds.map(String)),
  };
}

export async function listQuestions(
  filter: QuestionFilter,
  userId?: string,
): Promise<QuestionListResult> {
  if (be() === "supabase") return listQuestionsSupabase(filter, userId);
  await connectDB();

  const query: Record<string, unknown> = { isPublished: true };
  if (filter.difficulty) query.difficulty = filter.difficulty;
  if (filter.category) query.category = filter.category;
  if (filter.company) query.companies = filter.company;
  if (filter.tag) query.tags = filter.tag;
  if (filter.q) {
    query.$or = [
      { title: { $regex: filter.q, $options: "i" } },
      { tags: { $regex: filter.q, $options: "i" } },
    ];
  }

  const statuses = userId
    ? await getUserQuestionStatuses(userId)
    : { solved: new Set<string>(), attempted: new Set<string>() };

  // Status filtering happens on ids so pagination stays correct
  if (filter.status && userId) {
    const solvedIds = [...statuses.solved].map((id) => new Types.ObjectId(id));
    const attemptedIds = [...statuses.attempted].map(
      (id) => new Types.ObjectId(id),
    );
    if (filter.status === "solved") query._id = { $in: solvedIds };
    else if (filter.status === "attempted") {
      query._id = {
        $in: attemptedIds.filter((id) => !statuses.solved.has(id.toString())),
      };
    } else query._id = { $nin: attemptedIds };
  }

  const skip = (filter.page - 1) * filter.limit;
  const [docs, total] = await Promise.all([
    Question.find(query)
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(filter.limit)
      .select("slug title difficulty category tags companies stats")
      .lean(),
    Question.countDocuments(query),
  ]);

  const items: QuestionListItem[] = docs.map((doc) => {
    const id = doc._id.toString();
    return {
      id,
      slug: doc.slug,
      title: doc.title,
      difficulty: doc.difficulty,
      category: doc.category,
      tags: doc.tags,
      companies: doc.companies,
      acceptanceRate:
        doc.stats.submissions > 0
          ? Math.round((doc.stats.accepted / doc.stats.submissions) * 100)
          : null,
      status: statuses.solved.has(id)
        ? "solved"
        : statuses.attempted.has(id)
          ? "attempted"
          : "todo",
    };
  });

  return {
    items,
    total,
    page: filter.page,
    hasMore: skip + docs.length < total,
  };
}

interface SbQuestionRow {
  id: string;
  slug: string;
  title: string;
  difficulty: string;
  category: string;
  tags: string[] | null;
  companies: string[] | null;
  stats: QStats | null;
}

async function listQuestionsSupabase(
  filter: QuestionFilter,
  userId?: string,
): Promise<QuestionListResult> {
  const sb = supabaseAdmin();

  const statuses = userId
    ? await getUserQuestionStatuses(userId)
    : { solved: new Set<string>(), attempted: new Set<string>() };

  let q = sb
    .from("questions")
    .select("id,slug,title,difficulty,category,tags,companies,stats", {
      count: "exact",
    })
    .eq("is_published", true);

  if (filter.difficulty) q = q.eq("difficulty", filter.difficulty);
  if (filter.category) q = q.eq("category", filter.category);
  if (filter.company) q = q.contains("companies", [filter.company]);
  if (filter.tag) q = q.contains("tags", [filter.tag]);
  if (filter.q) q = q.or(`title.ilike.%${filter.q}%,tags.cs.{${filter.q}}`);

  // Status filtering on ids so pagination stays correct
  if (filter.status && userId) {
    if (filter.status === "solved") {
      q = q.in("id", [...statuses.solved]);
    } else if (filter.status === "attempted") {
      const onlyAttempted = [...statuses.attempted].filter(
        (id) => !statuses.solved.has(id),
      );
      q = q.in("id", onlyAttempted);
    } else {
      // todo: not attempted — Postgres can't express NOT IN a JS array cheaply,
      // so exclude via a negated filter list when small, else post-filter.
      const attempted = [...statuses.attempted];
      if (attempted.length) q = q.not("id", "in", `(${attempted.join(",")})`);
    }
  }

  const skip = (filter.page - 1) * filter.limit;
  const { data, count, error } = await q
    .order("created_at", { ascending: true })
    .range(skip, skip + filter.limit - 1);
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as SbQuestionRow[];
  const items: QuestionListItem[] = rows.map((doc) => ({
    id: doc.id,
    slug: doc.slug,
    title: doc.title,
    difficulty: doc.difficulty,
    category: doc.category,
    tags: doc.tags ?? [],
    companies: doc.companies ?? [],
    acceptanceRate: acceptanceRate(doc.stats),
    status: statuses.solved.has(doc.id)
      ? "solved"
      : statuses.attempted.has(doc.id)
        ? "attempted"
        : "todo",
  }));

  const total = count ?? 0;
  return { items, total, page: filter.page, hasMore: skip + rows.length < total };
}

/** Public view of a question — hidden test cases and solution stripped */
export async function getQuestionBySlug(slug: string) {
  if (be() === "supabase") return getQuestionBySlugSupabase(slug);
  await connectDB();
  const doc = await Question.findOne({ slug, isPublished: true }).lean();
  if (!doc) return null;

  return {
    id: doc._id.toString(),
    slug: doc.slug,
    title: doc.title,
    difficulty: doc.difficulty,
    category: doc.category,
    tags: doc.tags,
    companies: doc.companies,
    description: doc.description,
    // strip subdocument _id ObjectIds — they can't serialize to client components
    examples: doc.examples.map((example) => ({
      input: example.input,
      output: example.output,
      explanation: example.explanation ?? null,
    })),
    constraints: doc.constraints,
    starterCode: mapToObject(doc.starterCode),
    sampleTests: doc.testCases
      .filter((tc) => !tc.hidden)
      .map((tc) => ({ input: tc.input, expected: tc.expected })),
    hiddenTestCount: doc.testCases.filter((tc) => tc.hidden).length,
    hints: doc.hints,
    editorial: doc.editorial ?? null,
    acceptanceRate:
      doc.stats.submissions > 0
        ? Math.round((doc.stats.accepted / doc.stats.submissions) * 100)
        : null,
  };
}

interface SbExample {
  input: string;
  output: string;
  explanation?: string | null;
}
interface SbTestCase {
  input: string;
  expected: string;
  hidden?: boolean;
}
interface SbQuestionDetailRow {
  id: string;
  slug: string;
  title: string;
  difficulty: string;
  category: string;
  tags: string[] | null;
  companies: string[] | null;
  description: string;
  examples: SbExample[] | null;
  constraints: string[] | null;
  starter_code: Record<string, string> | null;
  test_cases: SbTestCase[] | null;
  hints: string[] | null;
  editorial: string | null;
  stats: QStats | null;
}

async function getQuestionBySlugSupabase(slug: string) {
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("questions")
    .select(
      "id,slug,title,difficulty,category,tags,companies,description,examples,constraints,starter_code,test_cases,hints,editorial,stats",
    )
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const doc = data as SbQuestionDetailRow;
  const testCases = doc.test_cases ?? [];

  return {
    id: doc.id,
    slug: doc.slug,
    title: doc.title,
    difficulty: doc.difficulty,
    category: doc.category,
    tags: doc.tags ?? [],
    companies: doc.companies ?? [],
    description: doc.description,
    examples: (doc.examples ?? []).map((example) => ({
      input: example.input,
      output: example.output,
      explanation: example.explanation ?? null,
    })),
    constraints: doc.constraints ?? [],
    starterCode: doc.starter_code ?? {},
    sampleTests: testCases
      .filter((tc) => !tc.hidden)
      .map((tc) => ({ input: tc.input, expected: tc.expected })),
    hiddenTestCount: testCases.filter((tc) => tc.hidden).length,
    hints: doc.hints ?? [],
    editorial: doc.editorial ?? null,
    acceptanceRate: acceptanceRate(doc.stats),
  };
}

export type QuestionDetail = NonNullable<
  Awaited<ReturnType<typeof getQuestionBySlug>>
>;
