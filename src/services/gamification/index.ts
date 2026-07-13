import { Types } from "mongoose";
import {
  levelForXp,
  XP_REWARDS,
  XP_FRONTEND_CHALLENGE,
  type Difficulty,
} from "@/lib/constants";
import {
  DailyActivity,
  Progress,
  Roadmap,
  User,
  type RoadmapDoc,
} from "@/models";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { backendFor } from "@/lib/data-backend";
import { checkAndAwardBadges, type EarnedBadge, type BadgeStats } from "./badges";

const be = () => backendFor("gamification");

/** Full mutable stats used during an accepted solve. */
interface SolveStats extends BadgeStats {
  xp: number;
  streak: { current: number; longest: number; lastActiveDate: string | null };
}

export { checkAndAwardBadges, ensureDefaultBadges, awardContestBadge } from "./badges";

export function todayUTC(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

function yesterdayUTC(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return todayUTC(d);
}

export interface SolveRewards {
  xpEarned: number;
  newLevel: number | null;
  streak: number;
  newBadges: { key: string; name: string; description: string; icon: string }[];
}

interface RecordSolveOptions {
  userId: string;
  kind: "dsa" | "frontend";
  difficulty: Difficulty;
  /** Only first-time accepted solves earn XP and counters */
  firstAccept: boolean;
  xpBonus?: number;
  /** Question tags + category, used to advance roadmap progress */
  tags?: string[];
}

/** Upsert today's activity row (heatmap source). Call on EVERY submission. */
export async function recordDailyActivity(
  userId: string,
  accepted: boolean,
  xpEarned = 0,
): Promise<void> {
  if (be() === "supabase") {
    const { error } = await supabaseAdmin().rpc("increment_daily_activity", {
      p_user: userId,
      p_date: todayUTC(),
      p_submissions: 1,
      p_accepted: accepted ? 1 : 0,
      p_xp: xpEarned,
    });
    if (error) throw new Error(error.message);
    return;
  }
  await DailyActivity.updateOne(
    { user: new Types.ObjectId(userId), date: todayUTC() },
    {
      $inc: {
        submissions: 1,
        accepted: accepted ? 1 : 0,
        xpEarned,
      },
    },
    { upsert: true },
  );
}

/**
 * Apply XP, streak, level, badge and roadmap effects of an accepted solve.
 */
export async function recordAcceptedSolve(
  options: RecordSolveOptions,
): Promise<SolveRewards> {
  const stats = await loadSolveStats(options.userId);
  if (!stats) {
    return { xpEarned: 0, newLevel: null, streak: 0, newBadges: [] };
  }

  let xpEarned = 0;
  if (options.firstAccept) {
    const base =
      options.kind === "frontend"
        ? XP_FRONTEND_CHALLENGE[options.difficulty]
        : XP_REWARDS[options.difficulty];
    xpEarned = base + (options.xpBonus ?? 0);

    stats.xp += xpEarned;
    if (options.kind === "frontend") {
      stats.frontendCompleted += 1;
    } else {
      const bucket = options.difficulty.toLowerCase() as
        | "easy"
        | "medium"
        | "hard";
      stats.solved[bucket] += 1;
      stats.solved.total += 1;
    }
  }

  // Streak: any accepted solve counts toward today
  const today = todayUTC();
  const last = stats.streak.lastActiveDate;
  if (last !== today) {
    stats.streak.current =
      last === yesterdayUTC() ? stats.streak.current + 1 : 1;
    stats.streak.lastActiveDate = today;
    stats.streak.longest = Math.max(stats.streak.longest, stats.streak.current);
  }

  const previousLevel = stats.level;
  stats.level = levelForXp(stats.xp);
  await saveSolveStats(options.userId, stats);

  let newBadges: EarnedBadge[] = [];
  try {
    newBadges = await checkAndAwardBadges({ id: options.userId, stats });
  } catch {
    // badge failures must never fail a submission
  }

  if (options.firstAccept && options.tags?.length) {
    try {
      await advanceRoadmapProgress(
        options.userId,
        options.kind === "frontend" ? "frontend" : "dsa",
        options.tags,
      );
    } catch {
      // progress is derived data; never fail the submission for it
    }
  }

  return {
    xpEarned,
    newLevel: stats.level > previousLevel ? stats.level : null,
    streak: stats.streak.current,
    newBadges: newBadges.map((badge) => ({
      key: badge.key,
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
    })),
  };
}

/** Load the mutable stats block for a user from the active backend. */
async function loadSolveStats(userId: string): Promise<SolveStats | null> {
  if (be() === "supabase") {
    const { data } = await supabaseAdmin()
      .from("users")
      .select("stats")
      .eq("id", userId)
      .maybeSingle();
    if (!data) return null;
    const s = ((data as { stats: Partial<SolveStats> | null }).stats ?? {}) as Partial<SolveStats>;
    return {
      xp: s.xp ?? 0,
      level: s.level ?? 1,
      frontendCompleted: s.frontendCompleted ?? 0,
      solved: {
        easy: s.solved?.easy ?? 0,
        medium: s.solved?.medium ?? 0,
        hard: s.solved?.hard ?? 0,
        total: s.solved?.total ?? 0,
      },
      streak: {
        current: s.streak?.current ?? 0,
        longest: s.streak?.longest ?? 0,
        lastActiveDate: s.streak?.lastActiveDate ?? null,
      },
    };
  }
  const user = await User.findById(userId).select("stats").lean();
  if (!user) return null;
  return {
    xp: user.stats.xp,
    level: user.stats.level,
    frontendCompleted: user.stats.frontendCompleted,
    solved: { ...user.stats.solved },
    streak: {
      current: user.stats.streak.current,
      longest: user.stats.streak.longest,
      lastActiveDate: user.stats.streak.lastActiveDate ?? null,
    },
  };
}

/** Persist the mutated stats block back to the active backend. */
async function saveSolveStats(userId: string, stats: SolveStats): Promise<void> {
  if (be() === "supabase") {
    const { error } = await supabaseAdmin()
      .from("users")
      .update({ stats })
      .eq("id", userId);
    if (error) throw new Error(error.message);
    return;
  }
  await User.updateOne(
    { _id: new Types.ObjectId(userId) },
    {
      $set: {
        "stats.xp": stats.xp,
        "stats.level": stats.level,
        "stats.frontendCompleted": stats.frontendCompleted,
        "stats.solved": stats.solved,
        "stats.streak": stats.streak,
      },
    },
  );
}

function countTopics(roadmap: RoadmapDoc): number {
  return roadmap.sections.reduce(
    (sum, section) => sum + section.topics.length,
    0,
  );
}

/** Increment topic solve counters for every topic matching the solve's tags */
export async function advanceRoadmapProgress(
  userId: string,
  track: "dsa" | "frontend",
  tags: string[],
): Promise<void> {
  const lowerTags = new Set(tags.map((t) => t.toLowerCase()));

  if (be() === "supabase") {
    const sb = supabaseAdmin();
    const { data: roadmap } = await sb
      .from("roadmaps")
      .select("sections")
      .eq("track", track)
      .maybeSingle();
    if (!roadmap) return;
    const sections = (roadmap as { sections: RoadmapSectionLite[] }).sections;

    const matchedTopics = sections.flatMap((section) =>
      section.topics.filter((topic) =>
        topic.matchTags.some((tag) => lowerTags.has(tag.toLowerCase())),
      ),
    );
    if (matchedTopics.length === 0) return;

    const { data: existing } = await sb
      .from("progress")
      .select("id,topic_solves,completed_topics")
      .eq("user_id", userId)
      .eq("track", track)
      .maybeSingle();

    const topicSolves: Record<string, number> = {
      ...((existing as { topic_solves?: Record<string, number> } | null)?.topic_solves ?? {}),
    };
    const completedTopics: string[] = [
      ...((existing as { completed_topics?: string[] } | null)?.completed_topics ?? []),
    ];

    for (const topic of matchedTopics) {
      const next = (topicSolves[topic.key] ?? 0) + 1;
      topicSolves[topic.key] = next;
      if (next >= topic.requiredSolves && !completedTopics.includes(topic.key)) {
        completedTopics.push(topic.key);
      }
    }

    const total = sections.reduce((sum, s) => sum + s.topics.length, 0);
    const percent =
      total > 0 ? Math.round((completedTopics.length / total) * 100) : 0;

    const row = {
      user_id: userId,
      track,
      topic_solves: topicSolves,
      completed_topics: completedTopics,
      percent,
    };
    if (existing) {
      await sb
        .from("progress")
        .update(row)
        .eq("id", (existing as { id: string }).id);
    } else {
      await sb.from("progress").insert(row);
    }
    return;
  }

  const roadmap = await Roadmap.findOne({ track }).lean();
  if (!roadmap) return;

  const matchedTopics = roadmap.sections.flatMap((section) =>
    section.topics.filter((topic) =>
      topic.matchTags.some((tag) => lowerTags.has(tag.toLowerCase())),
    ),
  );
  if (matchedTopics.length === 0) return;

  const progress = await Progress.findOneAndUpdate(
    { user: new Types.ObjectId(userId), track },
    { $setOnInsert: { completedTopics: [], percent: 0 } },
    { upsert: true, returnDocument: 'after' },
  );

  for (const topic of matchedTopics) {
    const current = progress.topicSolves.get(topic.key) ?? 0;
    progress.topicSolves.set(topic.key, current + 1);
    if (
      current + 1 >= topic.requiredSolves &&
      !progress.completedTopics.includes(topic.key)
    ) {
      progress.completedTopics.push(topic.key);
    }
  }

  const total = countTopics(roadmap);
  progress.percent =
    total > 0
      ? Math.round((progress.completedTopics.length / total) * 100)
      : 0;
  await progress.save();
}

/** Roadmap section/topic shape as stored in the `sections` jsonb column. */
interface RoadmapSectionLite {
  topics: { key: string; matchTags: string[]; requiredSolves: number }[];
}
