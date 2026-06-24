import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { requireUser } from "@/lib/api-auth";
import { connectDB } from "@/lib/mongodb";
import { Subscription } from "@/models";
import { getAiUsage } from "@/services/ai-credits";

/** AI credit usage + subscription/invoice history for the billing panel. */
export async function GET() {
  const { session, error } = await requireUser();
  if (error) return error;

  await connectDB();
  const userId = new Types.ObjectId(session.user.id);

  const [usage, subs] = await Promise.all([
    getAiUsage(session.user.id, session.user.plan),
    Subscription.find({ user: userId, status: "paid" })
      .sort({ createdAt: -1 })
      .limit(24)
      .select("plan billingCycle amount currency periodStart periodEnd razorpayPaymentId createdAt")
      .lean(),
  ]);

  return NextResponse.json({
    plan: session.user.plan,
    usage,
    history: subs.map((s) => ({
      id: s._id.toString(),
      plan: s.plan,
      billingCycle: s.billingCycle,
      amount: s.amount,
      currency: s.currency,
      periodStart: s.periodStart,
      periodEnd: s.periodEnd,
      paymentId: s.razorpayPaymentId ?? null,
      createdAt: s.createdAt,
    })),
  });
}
