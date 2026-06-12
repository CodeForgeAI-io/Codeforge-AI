import { Types } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { FrontendChallenge, Submission } from "@/models";

/** Stored file array -> path->code record used by the sandbox/admin UIs */
export function filesToRecord(
  files: { path: string; code: string }[] | undefined,
): Record<string, string> {
  return Object.fromEntries((files ?? []).map((file) => [file.path, file.code]));
}

/** path->code record (authoring format) -> stored file array */
export function recordToFiles(
  record: Record<string, string>,
): { path: string; code: string }[] {
  return Object.entries(record).map(([path, code]) => ({ path, code }));
}

export interface ChallengeListItem {
  id: string;
  slug: string;
  title: string;
  difficulty: string;
  tech: string;
  tags: string[];
  brief: string;
  completed: boolean;
}

export async function listChallenges(
  filters: { tech?: string; difficulty?: string },
  userId?: string,
): Promise<ChallengeListItem[]> {
  await connectDB();

  const query: Record<string, unknown> = { isPublished: true };
  if (filters.tech) query.tech = filters.tech;
  if (filters.difficulty) query.difficulty = filters.difficulty;

  const [docs, completedIds] = await Promise.all([
    FrontendChallenge.find(query)
      .sort({ createdAt: 1 })
      .select("slug title difficulty tech tags brief")
      .lean(),
    userId
      ? Submission.distinct("challenge", {
          user: new Types.ObjectId(userId),
          kind: "frontend",
          status: "Accepted",
        })
      : Promise.resolve([]),
  ]);

  const completed = new Set(completedIds.map(String));
  return docs.map((doc) => ({
    id: doc._id.toString(),
    slug: doc.slug,
    title: doc.title,
    difficulty: doc.difficulty,
    tech: doc.tech,
    tags: doc.tags,
    brief: doc.brief,
    completed: completed.has(doc._id.toString()),
  }));
}

export async function getChallengeBySlug(slug: string) {
  await connectDB();
  const doc = await FrontendChallenge.findOne({
    slug,
    isPublished: true,
  }).lean();
  if (!doc) return null;

  return {
    id: doc._id.toString(),
    slug: doc.slug,
    title: doc.title,
    difficulty: doc.difficulty,
    tech: doc.tech,
    tags: doc.tags,
    brief: doc.brief,
    description: doc.description,
    checklist: doc.checklist,
    starterFiles: filesToRecord(doc.starterFiles),
  };
}

export type ChallengeDetail = NonNullable<
  Awaited<ReturnType<typeof getChallengeBySlug>>
>;
