import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { GenUsage } from "@/models";
import { PLANS, type PlanId } from "@/lib/plans";

/** Current period, "YYYY-MM" (UTC) — matches the AI-credit period. */
export function currentPeriod(): string {
  return new Date().toISOString().slice(0, 7);
}

/** Monthly problem-generation allowance for a plan (Infinity = unlimited). */
export function genAllowance(plan: string): number {
  const limit = (PLANS[plan as PlanId] ?? PLANS.free).limits.problemGenPerMonth;
  return limit < 0 ? Infinity : limit;
}

export interface GenUsageSummary {
  period: string;
  used: number;
  allowance: number | null; // null = unlimited
  remaining: number | null;
  unlimited: boolean;
}

export async function getGenUsage(userId: string, plan: string): Promise<GenUsageSummary> {
  await connectDB();
  const period = currentPeriod();
  const doc = await GenUsage.findOne({ user: new Types.ObjectId(userId), period })
    .select("count")
    .lean();
  const used = doc?.count ?? 0;
  const allowance = genAllowance(plan);
  const unlimited = !Number.isFinite(allowance);
  return {
    period,
    used,
    allowance: unlimited ? null : allowance,
    remaining: unlimited ? null : Math.max(0, allowance - used),
    unlimited,
  };
}

/**
 * Enforce the monthly problem-generation quota for a request that will create
 * `count` problems. Returns a 402 response when it would exceed the allowance;
 * otherwise increments the counter and returns null.
 */
export async function enforceGenQuota(
  userId: string,
  plan: string,
  count: number,
): Promise<NextResponse | null> {
  const allowance = genAllowance(plan);
  if (Number.isFinite(allowance)) {
    await connectDB();
    const doc = await GenUsage.findOne({
      user: new Types.ObjectId(userId),
      period: currentPeriod(),
    })
      .select("count")
      .lean();
    const used = doc?.count ?? 0;
    if (used + count > allowance) {
      const remaining = Math.max(0, allowance - used);
      return NextResponse.json(
        {
          error:
            remaining === 0
              ? `You've reached your monthly limit of ${allowance} generated problems. Upgrade your plan to generate more.`
              : `This would exceed your monthly limit of ${allowance} generated problems (${remaining} left). Upgrade your plan for more.`,
          code: "gen_quota_exhausted",
          remaining,
          allowance,
        },
        { status: 402 },
      );
    }
  }
  await connectDB();
  await GenUsage.updateOne(
    { user: new Types.ObjectId(userId), period: currentPeriod() },
    { $inc: { count } },
    { upsert: true },
  );
  return null;
}
