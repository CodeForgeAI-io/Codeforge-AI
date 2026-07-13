import { Types } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { FrontendChallenge, Submission } from "@/models";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { backendFor } from "@/lib/data-backend";

const be = () => backendFor("challenges");

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
  if (be() === "supabase") {
    const sb = supabaseAdmin();
    let q = sb
      .from("frontend_challenges")
      .select("id,slug,title,difficulty,tech,tags,brief")
      .eq("is_published", true)
      .order("created_at", { ascending: true });
    if (filters.tech) q = q.eq("tech", filters.tech);
    if (filters.difficulty) q = q.eq("difficulty", filters.difficulty);
    const [listRes, doneRes] = await Promise.all([
      q,
      userId
        ? sb
            .from("submissions")
            .select("challenge_id")
            .eq("user_id", userId)
            .eq("kind", "frontend")
            .eq("status", "Accepted")
            .not("challenge_id", "is", null)
        : Promise.resolve({ data: [], error: null }),
    ]);
    if (listRes.error) throw new Error(listRes.error.message);
    if (doneRes.error) throw new Error(doneRes.error.message);
    const completed = new Set(
      (doneRes.data ?? []).map((r) => String(r.challenge_id)),
    );
    return (listRes.data ?? []).map((doc) => ({
      id: doc.id,
      slug: doc.slug,
      title: doc.title,
      difficulty: doc.difficulty,
      tech: doc.tech,
      tags: doc.tags ?? [],
      brief: doc.brief,
      completed: completed.has(doc.id),
    }));
  }

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

interface SbChallengeDetailRow {
  id: string;
  slug: string;
  title: string;
  difficulty: string;
  tech: string;
  tags: string[] | null;
  brief: string;
  description: string;
  checklist: string[] | null;
  starter_files: { path: string; code: string }[] | null;
}

export async function getChallengeBySlug(slug: string) {
  if (be() === "supabase") {
    const { data, error } = await supabaseAdmin()
      .from("frontend_challenges")
      .select(
        "id,slug,title,difficulty,tech,tags,brief,description,checklist,starter_files",
      )
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    const doc = data as SbChallengeDetailRow;
    return {
      id: doc.id,
      slug: doc.slug,
      title: doc.title,
      difficulty: doc.difficulty,
      tech: doc.tech,
      tags: doc.tags ?? [],
      brief: doc.brief,
      description: doc.description,
      checklist: doc.checklist ?? [],
      starterFiles: filesToRecord(doc.starter_files ?? []),
    };
  }
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

export interface SubmittableChallenge {
  id: string;
  title: string;
  difficulty: string;
  tech: string;
  designSpec: string;
  checklist: string[];
  tags: string[];
}

/** Fetch a published challenge's data needed to grade a submission. */
export async function getSubmittableChallenge(
  challengeId: string,
): Promise<SubmittableChallenge | null> {
  if (be() === "supabase") {
    const { data } = await supabaseAdmin()
      .from("frontend_challenges")
      .select("id,title,difficulty,tech,design_spec,checklist,tags")
      .eq("id", challengeId)
      .eq("is_published", true)
      .maybeSingle();
    if (!data) return null;
    const c = data as {
      id: string; title: string; difficulty: string; tech: string;
      design_spec: string | null; checklist: string[] | null; tags: string[] | null;
    };
    return {
      id: c.id, title: c.title, difficulty: c.difficulty, tech: c.tech,
      designSpec: c.design_spec ?? "", checklist: c.checklist ?? [], tags: c.tags ?? [],
    };
  }
  const { Types } = await import("mongoose");
  if (!Types.ObjectId.isValid(challengeId)) return null;
  await connectDB();
  const doc = await FrontendChallenge.findOne({ _id: challengeId, isPublished: true }).lean();
  if (!doc) return null;
  return {
    id: doc._id.toString(),
    title: doc.title,
    difficulty: doc.difficulty,
    tech: doc.tech,
    designSpec: doc.designSpec ?? "",
    checklist: doc.checklist,
    tags: doc.tags,
  };
}

/** Atomically bump a challenge's attempt/completion counters. */
export async function incrementChallengeStats(
  challengeId: string,
  accepted: boolean,
): Promise<void> {
  if (be() === "supabase") {
    const { error } = await supabaseAdmin().rpc("increment_challenge_stats", {
      p_challenge: challengeId,
      p_attempts: 1,
      p_completed: accepted ? 1 : 0,
    });
    if (error) throw new Error(error.message);
    return;
  }
  const { Types } = await import("mongoose");
  await connectDB();
  await FrontendChallenge.updateOne(
    { _id: new Types.ObjectId(challengeId) },
    { $inc: { "stats.attempts": 1, "stats.completed": accepted ? 1 : 0 } },
  );
}
