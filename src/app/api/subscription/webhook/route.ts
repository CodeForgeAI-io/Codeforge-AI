import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User, Subscription, WebhookEvent } from "@/models";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { getPostHogServer } from "@/lib/posthog-server";

export const runtime = "nodejs";
// Razorpay needs the raw, unmodified body to validate the signature.
export const dynamic = "force-dynamic";

interface RzpEntity {
  id?: string;
  plan_id?: string;
  status?: string;
  current_end?: number;
  amount?: number;
  currency?: string;
  notes?: Record<string, string>;
}

function addPeriod(from: Date, cycle: string): Date {
  const end = new Date(from);
  if (cycle === "yearly") end.setFullYear(end.getFullYear() + 1);
  else end.setMonth(end.getMonth() + 1);
  return end;
}

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  // 1) Authenticate the webhook — reject anything we can't verify.
  if (!verifyWebhookSignature(raw, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let payload: { event?: string; payload?: { subscription?: { entity?: RzpEntity }; payment?: { entity?: RzpEntity } } };
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventType = payload.event ?? "unknown";
  const eventId = req.headers.get("x-razorpay-event-id") ?? `${eventType}:${Date.now()}`;

  await connectDB();

  // 2) Idempotency — a duplicate delivery fails this unique insert and exits.
  try {
    await WebhookEvent.create({ _id: eventId, event: eventType });
  } catch {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  const subEntity = payload.payload?.subscription?.entity;
  const payEntity = payload.payload?.payment?.entity;

  try {
    switch (eventType) {
      case "subscription.charged": {
        const subId = subEntity?.id;
        if (!subId) break;
        const user = await User.findOne({ razorpaySubscriptionId: subId });
        const userId = user?._id?.toString() ?? subEntity?.notes?.userId;
        if (!userId) break;

        const plan = (user?.plan && user.plan !== "free" ? user.plan : subEntity?.notes?.plan) ?? "go";
        const cycle = user?.billingCycle ?? subEntity?.notes?.cycle ?? "monthly";
        const periodStart = new Date();
        const periodEnd = subEntity?.current_end
          ? new Date(subEntity.current_end * 1000)
          : addPeriod(periodStart, cycle);

        // Record the charge as an invoice (idempotent on payment id).
        if (payEntity?.id) {
          await Subscription.updateOne(
            { razorpayPaymentId: payEntity.id },
            {
              $setOnInsert: {
                user: userId,
                plan,
                billingCycle: cycle,
                amount: (payEntity.amount ?? 0) / 100,
                currency: payEntity.currency ?? "INR",
                kind: "subscription",
                razorpaySubscriptionId: subId,
                razorpayPaymentId: payEntity.id,
                status: "paid",
                periodStart,
                periodEnd,
              },
            },
            { upsert: true },
          );
        }

        await User.findByIdAndUpdate(userId, {
          plan,
          billingCycle: cycle,
          planExpiresAt: periodEnd,
          razorpaySubscriptionId: subId,
          subscriptionStatus: "active",
        });
        getPostHogServer()?.capture({ distinctId: String(userId), event: "subscription_renewed", properties: { plan, billing_cycle: cycle } });
        break;
      }

      case "subscription.activated":
      case "subscription.authenticated": {
        const subId = subEntity?.id;
        if (subId) await User.updateOne({ razorpaySubscriptionId: subId }, { subscriptionStatus: "active" });
        break;
      }

      case "subscription.halted": {
        const subId = subEntity?.id;
        if (subId) await User.updateOne({ razorpaySubscriptionId: subId }, { subscriptionStatus: "halted" });
        break;
      }

      case "subscription.cancelled":
      case "subscription.completed": {
        const subId = subEntity?.id;
        if (subId) {
          // Keep access until planExpiresAt; a later check downgrades to free.
          await User.updateOne(
            { razorpaySubscriptionId: subId },
            { subscriptionStatus: eventType === "subscription.completed" ? "completed" : "cancelled" },
          );
        }
        break;
      }

      case "payment.failed": {
        getPostHogServer()?.capture({
          distinctId: subEntity?.notes?.userId ?? "unknown",
          event: "payment_failed",
          properties: { paymentId: payEntity?.id },
        });
        break;
      }

      default:
        // Acknowledge unhandled events so Razorpay stops retrying.
        break;
    }
  } catch (e) {
    console.error("[razorpay-webhook]", eventType, e);
    // Return 500 so Razorpay retries a genuinely failed handler.
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
