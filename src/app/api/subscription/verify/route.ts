import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireUser } from "@/lib/api-auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { User, Subscription } from "@/models";
import { verifyCheckoutSignature } from "@/lib/razorpay";
import { redeemCoupon } from "@/lib/coupons";
import { getPostHogServer } from "@/lib/posthog-server";
import { PLANS } from "@/lib/plans";
import { sendEmail } from "@/lib/mailer";
import {
  trialStartedEmailHtml,
  trialStartedEmailSubject,
  paymentReceiptEmailHtml,
  paymentReceiptEmailSubject,
} from "@/lib/email-templates";

const APP_URL =
  process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://codeforgeai.io";

/** Format a date for billing emails, e.g. "18 Jul 2026". */
function fmtDate(d: Date): string {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

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
    // Card-on-file trial: the mandate is authenticated now but the first charge
    // fires later (Razorpay `start_at`). Grant access until the trial ends and
    // keep trialEndsAt set; `subscription.charged` will extend it on first bill.
    const isTrial = Boolean(sub.trialEndsAt && sub.trialEndsAt.getTime() > now.getTime());
    const accessUntil = isTrial ? sub.trialEndsAt! : periodEnd;

    await Subscription.updateOne(
      { _id: sub._id },
      {
        $set: {
          // Trial isn't paid until the first real charge; mark it authenticated.
          status: isTrial ? "created" : "paid",
          razorpayPaymentId,
          razorpaySignature,
          periodStart: now,
          periodEnd: accessUntil,
        },
      },
    );
    await User.findByIdAndUpdate(session.user.id, {
      plan: sub.plan,
      billingCycle: sub.billingCycle,
      planExpiresAt: accessUntil,
      razorpaySubscriptionId,
      subscriptionStatus: "active",
      cancelAtPeriodEnd: false,
      trialEndsAt: isTrial ? accessUntil : null,
    });
    // Record coupon redemption only after a confirmed payment (never on a trial).
    if (sub.couponCode && !isTrial) {
      await redeemCoupon({ code: sub.couponCode, userId: session.user.id, discount: sub.discount ?? 0 });
    }

    // Confirmation email (fire-and-forget — never block or fail the payment).
    const to = session.user.email;
    if (to) {
      const name = session.user.name ?? to.split("@")[0];
      const planName = PLANS[sub.plan].name;
      const manageUrl = `${APP_URL}/settings?tool=billing`;
      if (isTrial) {
        sendEmail({
          to,
          subject: trialStartedEmailSubject(planName, PLANS[sub.plan].trialDays),
          html: trialStartedEmailHtml({
            name,
            planName,
            trialDays: PLANS[sub.plan].trialDays,
            firstChargeDate: fmtDate(accessUntil),
            amountLabel: `₹${sub.amount}`,
            manageUrl,
          }),
        }).catch(() => {});
      } else {
        sendEmail({
          to,
          subject: paymentReceiptEmailSubject(planName, false),
          html: paymentReceiptEmailHtml({
            name,
            planName,
            amountLabel: `₹${sub.amount}`,
            periodEndLabel: fmtDate(accessUntil),
            renewal: false,
            manageUrl,
          }),
        }).catch(() => {});
      }
    }
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
