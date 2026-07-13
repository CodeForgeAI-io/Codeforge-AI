import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { PLANS, type BillingCycle, type PlanId } from "@/lib/plans";
import {
  paymentsEnabled,
  publicKeyId,
  getRazorpay,
  getOrCreatePlanId,
  amountForPlan,
} from "@/lib/razorpay";
import { validateCoupon, redeemCoupon } from "@/lib/coupons";
import {
  updateUserPlan,
  getUserBillingFields,
  createSubscriptionRecord,
} from "@/services/billing-store";

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
  let body: { plan?: PlanId; cycle?: BillingCycle; billing?: Billing; coupon?: string; trial?: boolean };
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

  const fullAmount = amountForPlan(plan, cycle) / 100; // rupees

  // Re-validate any coupon server-side — the client value is never trusted.
  let discount = 0;
  let couponCode: string | undefined;
  if (body.coupon) {
    const c = await validateCoupon({ code: body.coupon, plan, cycle, userId: session.user.id });
    if (!c.ok) {
      return NextResponse.json({ error: c.reason ?? "Invalid coupon" }, { status: 422 });
    }
    discount = c.discount ?? 0;
    couponCode = c.code;
  }
  const finalAmount = Math.max(0, fullAmount - discount); // rupees

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

  await updateUserPlan(session.user.id, { billing });

  // Card-on-file free trial: only for new users who never trialed, only when
  // no coupon is applied (a discounted first charge and a delayed first charge
  // don't mix cleanly). The card is authenticated up front; Razorpay makes the
  // first real charge at `start_at`, so the user pays nothing during the trial.
  const trialDays = PLANS[plan].trialDays;
  const existingUser = await getUserBillingFields(session.user.id);
  const wantsTrial =
    body.trial === true && trialDays > 0 && !couponCode && !existingUser?.trialEndsAt;
  const trialEndsAt = wantsTrial
    ? new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000)
    : null;

  // 100%-off coupon → grant the plan directly without a Razorpay charge.
  if (finalAmount <= 0 && couponCode) {
    const now = new Date();
    const periodEnd = new Date(now);
    if (cycle === "yearly") periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    else periodEnd.setMonth(periodEnd.getMonth() + 1);

    await createSubscriptionRecord({
      userId: session.user.id,
      plan,
      billingCycle: cycle,
      amount: 0,
      currency: "INR",
      kind: "subscription",
      couponCode,
      discount,
      razorpayPaymentId: `comp_${session.user.id}_${Date.now()}`,
      status: "paid",
      periodStart: now,
      periodEnd,
    });
    await updateUserPlan(session.user.id, {
      plan,
      billingCycle: cycle,
      planExpiresAt: periodEnd,
      subscriptionStatus: "active",
      cancelAtPeriodEnd: false,
      trialEndsAt: null,
    });
    await redeemCoupon({ code: couponCode, userId: session.user.id, discount });

    return NextResponse.json({ granted: true, plan, expiresAt: periodEnd });
  }

  try {
    // Discounted coupons use a plan priced at the final amount (recurring).
    const planId = await getOrCreatePlanId(plan, cycle, Math.round(finalAmount * 100));
    const subscription = await getRazorpay().subscriptions.create({
      plan_id: planId,
      // Recurring auto-pay: charge for many cycles (≈5 yrs) until cancelled.
      total_count: cycle === "yearly" ? 5 : 60,
      customer_notify: 1,
      // Trial: delay the first charge to the trial's end. Card is authenticated
      // now (₹0/nominal), first real charge fires at start_at → subscription.charged.
      ...(trialEndsAt ? { start_at: Math.floor(trialEndsAt.getTime() / 1000) } : {}),
      notes: {
        userId: session.user.id,
        plan,
        cycle,
        coupon: couponCode ?? "",
        address: [billing.line1, billing.city, billing.state, billing.postalCode, billing.country]
          .filter(Boolean)
          .join(", ")
          .slice(0, 250),
      },
    });

    await createSubscriptionRecord({
      userId: session.user.id,
      plan,
      billingCycle: cycle,
      amount: finalAmount,
      kind: "subscription",
      razorpaySubscriptionId: subscription.id,
      couponCode,
      discount,
      status: "created",
      ...(trialEndsAt ? { trialEndsAt } : {}),
    });

    return NextResponse.json({
      subscriptionId: subscription.id,
      key: publicKeyId(),
      plan,
      cycle,
      planName: PLANS[plan].name,
      amount: finalAmount,
      discount,
      coupon: couponCode ?? null,
      trial: Boolean(trialEndsAt),
      trialEndsAt,
    });
  } catch (e) {
    console.error("[create-subscription]", e);
    return NextResponse.json({ error: "Could not start subscription" }, { status: 502 });
  }
}
