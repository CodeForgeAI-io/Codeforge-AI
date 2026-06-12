import { Badge, UserBadge, type UserDoc, type BadgeDoc } from "@/models";
import type { Types } from "mongoose";

export const DEFAULT_BADGES = [
  // solving
  { key: "first-blood", name: "First Blood", description: "Solve your first problem", icon: "sword", tier: "bronze", criteria: { type: "solved_total", threshold: 1 } },
  { key: "problem-solver", name: "Problem Solver", description: "Solve 10 problems", icon: "puzzle", tier: "bronze", criteria: { type: "solved_total", threshold: 10 } },
  { key: "half-century", name: "Half Century", description: "Solve 50 problems", icon: "medal", tier: "silver", criteria: { type: "solved_total", threshold: 50 } },
  { key: "centurion", name: "Centurion", description: "Solve 100 problems", icon: "crown", tier: "gold", criteria: { type: "solved_total", threshold: 100 } },
  { key: "easy-rider", name: "Easy Rider", description: "Solve 25 easy problems", icon: "leaf", tier: "bronze", criteria: { type: "solved_easy", threshold: 25 } },
  { key: "medium-rare", name: "Medium Rare", description: "Solve 25 medium problems", icon: "flame", tier: "silver", criteria: { type: "solved_medium", threshold: 25 } },
  { key: "hard-core", name: "Hard Core", description: "Solve 10 hard problems", icon: "skull", tier: "gold", criteria: { type: "solved_hard", threshold: 10 } },
  // streaks
  { key: "warming-up", name: "Warming Up", description: "3-day solve streak", icon: "thermometer", tier: "bronze", criteria: { type: "streak", threshold: 3 } },
  { key: "on-fire", name: "On Fire", description: "7-day solve streak", icon: "flame", tier: "silver", criteria: { type: "streak", threshold: 7 } },
  { key: "unstoppable", name: "Unstoppable", description: "30-day solve streak", icon: "rocket", tier: "gold", criteria: { type: "streak", threshold: 30 } },
  // frontend
  { key: "pixel-pusher", name: "Pixel Pusher", description: "Complete 5 frontend challenges", icon: "paintbrush", tier: "bronze", criteria: { type: "frontend_completed", threshold: 5 } },
  { key: "ui-artisan", name: "UI Artisan", description: "Complete 15 frontend challenges", icon: "palette", tier: "silver", criteria: { type: "frontend_completed", threshold: 15 } },
  // levels
  { key: "level-5", name: "Rising Star", description: "Reach level 5", icon: "star", tier: "bronze", criteria: { type: "level", threshold: 5 } },
  { key: "level-10", name: "Code Veteran", description: "Reach level 10", icon: "shield", tier: "silver", criteria: { type: "level", threshold: 10 } },
  { key: "level-20", name: "Forge Master", description: "Reach level 20", icon: "hammer", tier: "gold", criteria: { type: "level", threshold: 20 } },
] as const;

let badgesEnsured = false;

export async function ensureDefaultBadges(): Promise<void> {
  if (badgesEnsured) return;
  const count = await Badge.estimatedDocumentCount();
  if (count === 0) {
    await Badge.insertMany(DEFAULT_BADGES, { ordered: false }).catch(() => {
      // concurrent seeding race — unique index keeps data consistent
    });
  }
  badgesEnsured = true;
}

function badgeMetric(user: UserDoc, badge: BadgeDoc): number {
  switch (badge.criteria.type) {
    case "solved_total":
      return user.stats.solved.total;
    case "solved_easy":
      return user.stats.solved.easy;
    case "solved_medium":
      return user.stats.solved.medium;
    case "solved_hard":
      return user.stats.solved.hard;
    case "streak":
      return user.stats.streak.current;
    case "frontend_completed":
      return user.stats.frontendCompleted;
    case "level":
      return user.stats.level;
    case "contest_participation":
      return 0; // awarded explicitly from the contest flow
    default:
      return 0;
  }
}

/** Awards any badges the user now qualifies for. Returns newly earned badges. */
export async function checkAndAwardBadges(
  user: UserDoc,
): Promise<BadgeDoc[]> {
  await ensureDefaultBadges();

  const [allBadges, owned] = await Promise.all([
    Badge.find().lean(),
    UserBadge.find({ user: user._id }).select("badge").lean(),
  ]);
  const ownedIds = new Set(owned.map((entry) => entry.badge.toString()));

  const earned = allBadges.filter(
    (badge) =>
      !ownedIds.has(badge._id.toString()) &&
      badge.criteria.type !== "contest_participation" &&
      badgeMetric(user, badge) >= badge.criteria.threshold,
  );

  if (earned.length > 0) {
    await UserBadge.insertMany(
      earned.map((badge) => ({ user: user._id, badge: badge._id })),
      { ordered: false },
    ).catch(() => {
      // duplicate key from a concurrent award — safe to ignore
    });
  }
  return earned;
}

export async function awardContestBadge(
  userId: Types.ObjectId,
): Promise<void> {
  await ensureDefaultBadges();
  const badge = await Badge.findOneAndUpdate(
    { key: "contender" },
    {
      $setOnInsert: {
        key: "contender",
        name: "Contender",
        description: "Participate in a contest",
        icon: "trophy",
        tier: "bronze",
        criteria: { type: "contest_participation", threshold: 1 },
      },
    },
    { upsert: true, new: true },
  );
  await UserBadge.updateOne(
    { user: userId, badge: badge._id },
    { $setOnInsert: { user: userId, badge: badge._id } },
    { upsert: true },
  ).catch(() => {});
}
