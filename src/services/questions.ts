import { Types } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { mapToObject } from "@/lib/utils";
import { Question, Submission } from "@/models";
import type { QuestionFilter } from "@/schemas/question";

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

/** Public view of a question — hidden test cases and solution stripped */
export async function getQuestionBySlug(slug: string) {
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

export type QuestionDetail = NonNullable<
  Awaited<ReturnType<typeof getQuestionBySlug>>
>;
