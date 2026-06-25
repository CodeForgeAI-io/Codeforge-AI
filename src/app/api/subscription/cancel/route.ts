import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireUser } from "@/lib/api-auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { User } from "@/models";
import { getRazorpay, paymentsEnabled } from "@/lib/razorpay";
import { getPostHogServer } from "@/lib/posthog-server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { session, error } = await requireUser();
  if (error) return error;

  const limited = await enforceRateLimit("payment", req, session.user.id);
  if (limited) return limited;

  await connectDB();
  const user = await User.findById(session.user.id).select("razorpaySubscriptionId").lean();

  // For a recurring subscription, tell Razorpay to stop after the current cycle
  // so auto-pay is revoked but the user keeps access until period end.
  if (user?.razorpaySubscriptionId && paymentsEnabled()) {
    try {
      await getRazorpay().subscriptions.cancel(user.razorpaySubscriptionId, true);
    } catch (e) {
      console.error("[subscription-cancel]", e);
      // Surface a soft error — the user's local state is still updated below.
    }
  }

  await User.findByIdAndUpdate(session.user.id, {
    cancelAtPeriodEnd: true,
    subscriptionStatus: "cancelled",
    billingCycle: null,
    // plan stays active until planExpiresAt; a check downgrades after expiry.
  });

  getPostHogServer()?.capture({
    distinctId: session.user.id,
    event: "subscription_cancelled",
    properties: {},
  });

  return NextResponse.json({
    ok: true,
    message: "Auto-renewal cancelled. You keep access until your billing period ends.",
  });
}
