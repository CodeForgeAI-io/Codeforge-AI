import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireUser } from "@/lib/api-auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { User, Subscription } from "@/models";
import { verifyCheckoutSignature } from "@/lib/razorpay";
import { getPostHogServer } from "@/lib/posthog-server";

export const runtime = "nodejs";

function addPeriod(from: Date, cycle: "monthly" | "yearly"): Date {
  const end = new Date(from);
  if (cycle === "yearly") end.setFullYear(end.getFullYear() + 1);
  else end.setMonth(end.getMonth() + 1);
  return end;
}

export async function POST(req: NextRequest) {
  const { session, error } = await requireUser();
  if (error) return error;

  const limited = await enforceRateLimit("payment", req, session.user.id);
  if (limited) return limited;

  const {
    razorpayOrderId,
    razorpaySubscriptionId,
    razorpayPaymentId,
    razorpaySignature,
  } = await req.json();

  if (!razorpayPaymentId || !razorpaySignature) {
    return NextResponse.json({ error: "Missing payment fields" }, { status: 400 });
  }

  // Constant-time signature verification (order OR subscription).
  const valid = verifyCheckoutSignature({
    orderId: razorpayOrderId,
    subscriptionId: razorpaySubscriptionId,
    paymentId: razorpayPaymentId,
    signature: razorpaySignature,
  });
  if (!valid) {
    return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
  }

  await connectDB();

  // Locate the tracking record and confirm it belongs to this user.
  const query = razorpaySubscriptionId
    ? { razorpaySubscriptionId, user: session.user.id }
    : { razorpayOrderId, user: session.user.id };
  const sub = await Subscription.findOne(query);
  if (!sub) {
    return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
  }

  const now = new Date();
  const periodEnd = addPeriod(now, sub.billingCycle);

  if (razorpaySubscriptionId) {
    // Recurring: mark the tracking doc paid and record the first invoice.
    await Subscription.updateOne(
      { _id: sub._id },
      {
        $set: {
          status: "paid",
          razorpayPaymentId,
          razorpaySignature,
          periodStart: now,
          periodEnd,
        },
      },
    );
    await User.findByIdAndUpdate(session.user.id, {
      plan: sub.plan,
      billingCycle: sub.billingCycle,
      planExpiresAt: periodEnd,
      razorpaySubscriptionId,
      subscriptionStatus: "active",
      cancelAtPeriodEnd: false,
      trialEndsAt: null,
    });
  } else {
    // One-time order.
    await Subscription.findByIdAndUpdate(sub._id, {
      razorpayPaymentId,
      razorpaySignature,
      status: "paid",
      periodStart: now,
      periodEnd,
    });
    await User.findByIdAndUpdate(session.user.id, {
      plan: sub.plan,
      billingCycle: sub.billingCycle,
      planExpiresAt: periodEnd,
      trialEndsAt: null,
    });
  }

  getPostHogServer()?.capture({
    distinctId: session.user.id,
    event: "subscription_purchased",
    properties: {
      plan: sub.plan,
      billing_cycle: sub.billingCycle,
      recurring: Boolean(razorpaySubscriptionId),
    },
  });

  return NextResponse.json({ ok: true, plan: sub.plan, expiresAt: periodEnd });
}
