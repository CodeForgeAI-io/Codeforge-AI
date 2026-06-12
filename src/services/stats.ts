import { Types } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { cached } from "@/lib/redis";
import { totalXpForLevel } from "@/lib/constants";
import {
  DailyActivity,
  Progress,
  Question,
  Submission,
  User,
  UserBadge,
  type UserDoc,
} from "@/models";

export interface HeatmapDay {
  date: string;
  count: number;
}

export interface DashboardData {
  name: string;
  username: string;
  image: string | null;
  joinedAt: string;
  bio: string | null;
  location: string | null;
  website: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  xp: number;
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  rank: number;
  streak: { current: number; longest: number };
  solved: { easy: number; medium: number; hard: number; total: number };
  totalQuestions: { easy: number; medium: number; hard: number; total: number };
  frontendCompleted: number;
  successRate: number | null;
  attempted: number;
  heatmap: HeatmapDay[];
  badges: { key: string; name: string; description: string; icon: string; tier: string; awardedAt: string }[];
  recentSubmissions: {
    id: string;
    title: string;
    slug: string;
    status: string;
    language: string | null;
    createdAt: string;
  }[];
  progress: { track: string; percent: number }[];
}

async function buildStats(user: UserDoc): Promise<DashboardData> {
  const userId = user._id;

  const oneYearAgo = new Date();
  oneYearAgo.setUTCFullYear(oneYearAgo.getUTCFullYear() - 1);
  const sinceDate = oneYearAgo.toISOString().slice(0, 10);

  const [
    rankAbove,
    activity,
    userBadges,
    recentSubmissions,
    attemptedCount,
    acceptedCount,
    submissionCount,
    progress,
    questionCounts,
  ] = await Promise.all([
    User.countDocuments({ "stats.xp": { $gt: user.stats.xp }, banned: false }),
    DailyActivity.find({ user: userId, date: { $gte: sinceDate } })
      .select("date accepted submissions")
      .lean(),
    UserBadge.find({ user: userId }).populate<{ badge: { key: string; name: string; description: string; icon: string; tier: string } }>("badge").lean(),
    Submission.find({ user: userId, kind: "dsa" })
      .sort({ createdAt: -1 })
      .limit(8)
      .populate<{ question: { title: string; slug: string } | null }>(
        "question",
        "title slug",
      )
      .select("status language createdAt question")
      .lean(),
    Submission.distinct("question", { user: userId, kind: "dsa" }),
    Submission.countDocuments({ user: userId, status: "Accepted" }),
    Submission.countDocuments({ user: userId }),
    Progress.find({ user: userId }).select("track percent").lean(),
    Question.aggregate<{ _id: string; count: number }>([
      { $match: { isPublished: true } },
      { $group: { _id: "$difficulty", count: { $sum: 1 } } },
    ]),
  ]);

  const totals = { easy: 0, medium: 0, hard: 0, total: 0 };
  for (const row of questionCounts) {
    const key = row._id.toLowerCase() as "easy" | "medium" | "hard";
    if (key in totals) {
      totals[key] = row.count;
      totals.total += row.count;
    }
  }

  const currentLevelXp = totalXpForLevel(user.stats.level);
  const nextLevelXp = totalXpForLevel(user.stats.level + 1);

  return {
    name: user.name,
    username: user.username,
    image: user.image ?? null,
    joinedAt: user.createdAt.toISOString(),
    bio: user.bio ?? null,
    location: user.location ?? null,
    website: user.website ?? null,
    githubUrl: user.githubUrl ?? null,
    linkedinUrl: user.linkedinUrl ?? null,
    xp: user.stats.xp,
    level: user.stats.level,
    xpIntoLevel: user.stats.xp - currentLevelXp,
    xpForNextLevel: nextLevelXp - currentLevelXp,
    rank: rankAbove + 1,
    streak: {
      current: user.stats.streak.current,
      longest: user.stats.streak.longest,
    },
    solved: { ...user.stats.solved },
    totalQuestions: totals,
    frontendCompleted: user.stats.frontendCompleted,
    successRate:
      submissionCount > 0
        ? Math.round((acceptedCount / submissionCount) * 100)
        : null,
    attempted: attemptedCount.length,
    heatmap: activity.map((day) => ({ date: day.date, count: day.accepted })),
    badges: userBadges
      .filter((entry) => entry.badge)
      .map((entry) => ({
        key: entry.badge.key,
        name: entry.badge.name,
        description: entry.badge.description,
        icon: entry.badge.icon,
        tier: entry.badge.tier,
        awardedAt: entry.awardedAt.toISOString(),
      })),
    recentSubmissions: recentSubmissions
      .filter((submission) => submission.question)
      .map((submission) => ({
        id: submission._id.toString(),
        title: submission.question!.title,
        slug: submission.question!.slug,
        status: submission.status,
        language: submission.language ?? null,
        createdAt: submission.createdAt.toISOString(),
      })),
    progress: progress.map((entry) => ({
      track: entry.track,
      percent: entry.percent,
    })),
  };
}

export async function getDashboardData(
  userId: string,
): Promise<DashboardData | null> {
  await connectDB();
  const user = await User.findById(userId);
  if (!user) return null;
  return buildStats(user);
}

export async function getPublicProfile(
  username: string,
): Promise<DashboardData | null> {
  await connectDB();
  const user = await User.findOne({
    username: username.toLowerCase(),
    banned: false,
  });
  if (!user) return null;
  return buildStats(user);
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  username: string;
  image: string | null;
  xp: number;
  level: number;
  solvedTotal: number;
  streak: number;
}

export async function getLeaderboard(limit = 50): Promise<LeaderboardEntry[]> {
  await connectDB();
  return cached(`leaderboard:top:${limit}`, 120, async () => {
    const users = await User.find({ banned: false })
      .sort({ "stats.xp": -1, createdAt: 1 })
      .limit(limit)
      .select("name username image stats")
      .lean();
    return users.map((user, index) => ({
      rank: index + 1,
      name: user.name,
      username: user.username,
      image: user.image ?? null,
      xp: user.stats.xp,
      level: user.stats.level,
      solvedTotal: user.stats.solved.total,
      streak: user.stats.streak.current,
    }));
  });
}

export async function getUserRank(userId: string): Promise<number> {
  await connectDB();
  const user = await User.findById(new Types.ObjectId(userId))
    .select("stats.xp")
    .lean();
  if (!user) return 0;
  const above = await User.countDocuments({
    "stats.xp": { $gt: user.stats.xp },
    banned: false,
  });
  return above + 1;
}
