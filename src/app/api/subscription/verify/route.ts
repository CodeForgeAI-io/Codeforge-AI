import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { activateVerifiedPayment } from "@/services/billing-activate";

export const runtime = "nodejs";

/** JSON verification endpoint used by the checkout page after payment. */
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

  const result = await activateVerifiedPayment({
    userId: session.user.id,
    userEmail: session.user.email ?? null,
    userName: session.user.name ?? null,
    razorpayOrderId,
    razorpaySubscriptionId,
    razorpayPaymentId,
    razorpaySignature,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ ok: true, plan: result.plan, expiresAt: result.expiresAt });
}
