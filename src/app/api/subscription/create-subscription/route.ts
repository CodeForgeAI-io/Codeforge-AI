import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireUser } from "@/lib/api-auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { Subscription, User } from "@/models";
import { PLANS, type BillingCycle, type PlanId } from "@/lib/plans";
import {
  paymentsEnabled,
  publicKeyId,
  getRazorpay,
  getOrCreatePlanId,
  amountForPlan,
} from "@/lib/razorpay";

export const runtime = "nodejs";

/** Create a recurring Razorpay subscription (auto-pay) for a plan + cycle. */
export async function POST(req: NextRequest) {
  if (!paymentsEnabled()) {
    return NextResponse.json({ error: "Payments are not available yet." }, { status: 503 });
  }

  const { session, error } = await requireUser();
  if (error) return error;

  const limited = await enforceRateLimit("payment", req, session.user.id);
  if (limited) return limited;

  interface Billing {
    phone?: string;
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  }
  let body: { plan?: PlanId; cycle?: BillingCycle; billing?: Billing };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const plan = body.plan;
  const cycle = body.cycle === "yearly" ? "yearly" : "monthly";
  // Server-authoritative: never trust a client-supplied amount.
  if (plan !== "go" && plan !== "plus") {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  // Sanitize + persist billing details for prefill, notes and invoices.
  const trim = (v: unknown, max = 120) => String(v ?? "").trim().slice(0, max);
  const billing: Billing = {
    phone: trim(body.billing?.phone, 20),
    line1: trim(body.billing?.line1),
    line2: trim(body.billing?.line2),
    city: trim(body.billing?.city, 80),
    state: trim(body.billing?.state, 80),
    postalCode: trim(body.billing?.postalCode, 20),
    country: trim(body.billing?.country, 2) || "IN",
  };

  await connectDB();
  await User.findByIdAndUpdate(session.user.id, { billing });
  try {
    const planId = await getOrCreatePlanId(plan, cycle);
    const subscription = await getRazorpay().subscriptions.create({
      plan_id: planId,
      // Recurring auto-pay: charge for many cycles (≈5 yrs) until cancelled.
      total_count: cycle === "yearly" ? 5 : 60,
      customer_notify: 1,
      notes: {
        userId: session.user.id,
        plan,
        cycle,
        address: [billing.line1, billing.city, billing.state, billing.postalCode, billing.country]
          .filter(Boolean)
          .join(", ")
          .slice(0, 250),
      },
    });

    await Subscription.create({
      user: session.user.id,
      plan,
      billingCycle: cycle,
      amount: amountForPlan(plan as PlanId, cycle) / 100,
      kind: "subscription",
      razorpaySubscriptionId: subscription.id,
      status: "created",
    });

    return NextResponse.json({
      subscriptionId: subscription.id,
      key: publicKeyId(),
      plan,
      cycle,
      planName: PLANS[plan].name,
    });
  } catch (e) {
    console.error("[create-subscription]", e);
    return NextResponse.json({ error: "Could not start subscription" }, { status: 502 });
  }
}
