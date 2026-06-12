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
  type BadgeDoc,
  type RoadmapDoc,
} from "@/models";
import { checkAndAwardBadges } from "./badges";

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
  const user = await User.findById(options.userId);
  if (!user) {
    return { xpEarned: 0, newLevel: null, streak: 0, newBadges: [] };
  }

  let xpEarned = 0;
  if (options.firstAccept) {
    const base =
      options.kind === "frontend"
        ? XP_FRONTEND_CHALLENGE[options.difficulty]
        : XP_REWARDS[options.difficulty];
    xpEarned = base + (options.xpBonus ?? 0);

    user.stats.xp += xpEarned;
    if (options.kind === "frontend") {
      user.stats.frontendCompleted += 1;
    } else {
      const bucket = options.difficulty.toLowerCase() as
        | "easy"
        | "medium"
        | "hard";
      user.stats.solved[bucket] += 1;
      user.stats.solved.total += 1;
    }
  }

  // Streak: any accepted solve counts toward today
  const today = todayUTC();
  const last = user.stats.streak.lastActiveDate;
  if (last !== today) {
    user.stats.streak.current =
      last === yesterdayUTC() ? user.stats.streak.current + 1 : 1;
    user.stats.streak.lastActiveDate = today;
    user.stats.streak.longest = Math.max(
      user.stats.streak.longest,
      user.stats.streak.current,
    );
  }

  const previousLevel = user.stats.level;
  user.stats.level = levelForXp(user.stats.xp);
  await user.save();

  let newBadges: BadgeDoc[] = [];
  try {
    newBadges = await checkAndAwardBadges(user);
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
    newLevel: user.stats.level > previousLevel ? user.stats.level : null,
    streak: user.stats.streak.current,
    newBadges: newBadges.map((badge) => ({
      key: badge.key,
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
    })),
  };
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
  const roadmap = await Roadmap.findOne({ track }).lean();
  if (!roadmap) return;

  const lowerTags = new Set(tags.map((t) => t.toLowerCase()));
  const matchedTopics = roadmap.sections.flatMap((section) =>
    section.topics.filter((topic) =>
      topic.matchTags.some((tag) => lowerTags.has(tag.toLowerCase())),
    ),
  );
  if (matchedTopics.length === 0) return;

  const progress = await Progress.findOneAndUpdate(
    { user: new Types.ObjectId(userId), track },
    { $setOnInsert: { completedTopics: [], percent: 0 } },
    { upsert: true, new: true },
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
