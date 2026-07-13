import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { getAiUsage } from "@/services/ai-credits";
import { listPaidSubscriptions } from "@/services/billing-store";

/** AI credit usage + subscription/invoice history for the billing panel. */
export async function GET() {
  const { session, error } = await requireUser();
  if (error) return error;

  const [usage, subs] = await Promise.all([
    getAiUsage(session.user.id, session.user.plan),
    listPaidSubscriptions(session.user.id, 24),
  ]);

  return NextResponse.json({
    plan: session.user.plan,
    usage,
    history: subs.map((s) => ({
      id: s.id,
      plan: s.plan,
      billingCycle: s.billingCycle,
      amount: s.amount,
      currency: s.currency,
      periodStart: s.periodStart,
      periodEnd: s.periodEnd,
      paymentId: s.paymentId,
      createdAt: s.createdAt,
    })),
  });
}
