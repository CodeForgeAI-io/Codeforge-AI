import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { validateCoupon } from "@/lib/coupons";
import type { BillingCycle, PlanId } from "@/lib/plans";

export const runtime = "nodejs";

/** Preview a coupon's discount for the signed-in user (does not redeem). */
export async function POST(req: NextRequest) {
  const { session, error } = await requireUser();
  if (error) return error;

  // Reuse the payment bucket to throttle code-guessing.
  const limited = await enforceRateLimit("payment", req, session.user.id);
  if (limited) return limited;

  let body: { code?: string; plan?: PlanId; cycle?: BillingCycle };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (body.plan !== "go" && body.plan !== "plus") {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }
  const cycle: BillingCycle = body.cycle === "yearly" ? "yearly" : "monthly";

  const result = await validateCoupon({
    code: body.code ?? "",
    plan: body.plan,
    cycle,
    userId: session.user.id,
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 422 });
}
