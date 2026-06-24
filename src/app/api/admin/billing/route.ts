import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/api-auth";
import { AiUsage, Subscription, User } from "@/models";
import { currentPeriod, monthlyAllowance } from "@/services/ai-credits";

/** Admin view: every user's plan, AI credit usage and payment totals. */
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
  if (planFilter && planFilter !== "all") query.plan = planFilter;

  const users = await User.find(query)
    .sort({ createdAt: -1 })
    .limit(200)
    .select("name username email image plan planExpiresAt trialEndsAt billingCycle createdAt")
    .lean();

  const userIds = users.map((u) => u._id);
  const period = currentPeriod();

  // AI usage for the current period, keyed by user id
  const usageDocs = await AiUsage.find({ user: { $in: userIds }, period })
    .select("user used")
    .lean();
  const usageByUser = new Map<string, number>();
  for (const d of usageDocs) usageByUser.set(String(d.user), d.used);

  // Paid revenue + payment count + last payment per user
  const payAgg = await Subscription.aggregate<{
    _id: Types.ObjectId;
    total: number;
    count: number;
    lastPaymentAt: Date;
    currency: string;
  }>([
    { $match: { user: { $in: userIds }, status: "paid" } },
    {
      $group: {
        _id: "$user",
        total: { $sum: "$amount" },
        count: { $sum: 1 },
        lastPaymentAt: { $max: "$createdAt" },
        currency: { $last: "$currency" },
      },
    },
  ]);
  const payByUser = new Map<string, (typeof payAgg)[number]>();
  for (const p of payAgg) payByUser.set(String(p._id), p);

  const now = Date.now();
  const rows = users.map((u) => {
    const id = String(u._id);
    const plan = u.plan ?? "free";
    const used = usageByUser.get(id) ?? 0;
    const allowance = monthlyAllowance(plan);
    const unlimited = !Number.isFinite(allowance);
    const pay = payByUser.get(id);
    const expiresAt = u.planExpiresAt ?? null;
    const active = plan !== "free" && (!expiresAt || new Date(expiresAt).getTime() > now);
    return {
      id,
      name: u.name,
      username: u.username,
      email: u.email,
      image: u.image ?? null,
      plan,
      active,
      billingCycle: u.billingCycle ?? null,
      planExpiresAt: expiresAt,
      trialEndsAt: u.trialEndsAt ?? null,
      usage: {
        period,
        used,
        allowance: unlimited ? null : allowance,
        remaining: unlimited ? null : Math.max(0, allowance - used),
        unlimited,
      },
      revenue: pay?.total ?? 0,
      payments: pay?.count ?? 0,
      currency: pay?.currency ?? "INR",
      lastPaymentAt: pay?.lastPaymentAt ?? null,
      createdAt: u.createdAt,
    };
  });

  // Platform-wide totals (across ALL paid subscriptions, not just the page)
  const [totals] = await Subscription.aggregate<{
    revenue: number;
    payments: number;
    currency: string;
  }>([
    { $match: { status: "paid" } },
    { $group: { _id: null, revenue: { $sum: "$amount" }, payments: { $sum: 1 }, currency: { $last: "$currency" } } },
  ]);

  const totalCreditsUsed = await AiUsage.aggregate<{ used: number }>([
    { $match: { period } },
    { $group: { _id: null, used: { $sum: "$used" } } },
  ]);

  const payingUsers = await User.countDocuments({ plan: { $in: ["go", "plus"] } });

  return NextResponse.json({
    rows,
    period,
    summary: {
      totalRevenue: totals?.revenue ?? 0,
      totalPayments: totals?.payments ?? 0,
      currency: totals?.currency ?? "INR",
      payingUsers,
      creditsUsedThisMonth: totalCreditsUsed[0]?.used ?? 0,
    },
  });
}
