import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/mongodb";
import { requireUser } from "@/lib/api-auth";
import { User } from "@/models";
import { Subscription } from "@/models/Subscription";

export async function POST(req: NextRequest) {
  const { session, error } = await requireUser();
  if (error) return error;

  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = await req.json();

  // Verify signature
  const body = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest("hex");

  if (expected !== razorpaySignature) {
    return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
  }

  await connectDB();
  const sub = await Subscription.findOne({ razorpayOrderId, user: session.user.id });
  if (!sub) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const now = new Date();
  const periodEnd = new Date(now);
  if (sub.billingCycle === "yearly") {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  } else {
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  }

  await Subscription.findByIdAndUpdate(sub._id, {
    razorpayPaymentId,
    razorpaySignature,
    status: "paid",
    periodStart: now,
    periodEnd,
  });

  await User.findByIdAndUpdate(session.user.id, {
    plan: sub.plan,
    planExpiresAt: periodEnd,
    billingCycle: sub.billingCycle,
    trialEndsAt: null,
  });

  return NextResponse.json({ ok: true, plan: sub.plan, expiresAt: periodEnd });
}
