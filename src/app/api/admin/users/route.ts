import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/api-auth";
import { User } from "@/models";

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  await connectDB();
  const q = req.nextUrl.searchParams.get("q")?.trim();
  const planFilter = req.nextUrl.searchParams.get("plan");
  const query: Record<string, unknown> = {};

  if (q) {
    const regex = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
    query.$or = [{ name: regex }, { email: regex }, { username: regex }];
  }
  if (planFilter && planFilter !== "all") {
    if (planFilter === "beta") query.betaUser = true;
    else query.plan = planFilter;
  }

  const users = await User.find(query)
    .sort({ createdAt: -1 })
    .limit(200)
    .select("name username email image role banned stats createdAt providers plan planExpiresAt trialEndsAt billingCycle betaUser")
    .lean();

  return NextResponse.json({
    users: users.map((user) => ({
      id: user._id.toString(),
      name: user.name,
      username: user.username,
      email: user.email,
      image: user.image ?? null,
      role: user.role,
      banned: user.banned,
      xp: user.stats.xp,
      level: user.stats.level,
      solved: user.stats.solved.total,
      solvedBreakdown: {
        easy: user.stats.solved.easy,
        medium: user.stats.solved.medium,
        hard: user.stats.solved.hard,
      },
      streak: user.stats.streak.current,
      longestStreak: user.stats.streak.longest,
      providers: user.providers,
      plan: user.plan ?? "free",
      planExpiresAt: user.planExpiresAt ?? null,
      trialEndsAt: user.trialEndsAt ?? null,
      billingCycle: user.billingCycle ?? null,
      betaUser: user.betaUser ?? false,
      createdAt: user.createdAt,
    })),
  });
}
