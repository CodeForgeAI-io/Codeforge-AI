import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { connectDB } from "@/lib/mongodb";
import { requireUser } from "@/lib/api-auth";
import { Subscription } from "@/models/Subscription";
import { PLANS } from "@/lib/plans";
import type { BillingCycle, PlanId } from "@/lib/plans";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: NextRequest) {
  const { session, error } = await requireUser();
  if (error) return error;

  const { plan, cycle }: { plan: PlanId; cycle: BillingCycle } = await req.json();

  const planDef = PLANS[plan];
  if (!planDef || plan === "free") {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const amount = cycle === "yearly" ? planDef.price.yearly : planDef.price.monthly;

  await connectDB();
  const order = await razorpay.orders.create({
    amount: amount * 100, // paise
    currency: "INR",
    receipt: `sub_${session.user.id}_${Date.now()}`,
    notes: { userId: session.user.id, plan, cycle },
  });

  await Subscription.create({
    user: session.user.id,
    plan,
    billingCycle: cycle,
    amount,
    razorpayOrderId: order.id,
    status: "created",
  });

  return NextResponse.json({
    orderId: order.id,
    amount,
    currency: "INR",
    key: process.env.RAZORPAY_KEY_ID,
  });
}
