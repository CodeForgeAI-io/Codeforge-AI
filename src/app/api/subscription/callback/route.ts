import { NextRequest, NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import { activateVerifiedPayment } from "@/services/billing-activate";
import { findSubscriptionOwner } from "@/services/billing-store";
import { getUserCheckout } from "@/services/user-store";

export const runtime = "nodejs";

/**
 * Razorpay hosted-checkout callback (full-page redirect flow, no popup).
 *
 * Razorpay POSTs the payment result here as a top-level cross-site navigation.
 * SameSite=Lax means the session cookies do NOT ride along on a cross-site
 * POST, so this route is deliberately session-free: the payment HMAC signature
 * is the authentication, and the owner is resolved from our own subscription
 * record for the gateway id. Nothing in the POST body is trusted before the
 * constant-time signature check inside activateVerifiedPayment.
 */
export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  // Original checkout context, carried on the callback URL itself.
  const back = new URLSearchParams();
  for (const k of ["plan", "cycle", "trial", "campaign", "code"] as const) {
    const v = url.searchParams.get(k);
    if (v) back.set(k, v);
  }
  const bounce = (extra: Record<string, string>) => {
    for (const [k, v] of Object.entries(extra)) back.set(k, v);
    return NextResponse.redirect(new URL(`/checkout?${back}`, req.url), 303);
  };

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return bounce({ payment: "failed", reason: "Malformed payment response" });
  }
  const field = (k: string) => {
    const v = form.get(k);
    return typeof v === "string" ? v : undefined;
  };

  // Razorpay reports failures as error[...] fields.
  const errorDescription = field("error[description]") ?? field("error[reason]");
  const paymentId = field("razorpay_payment_id");
  const signature = field("razorpay_signature");
  const subscriptionId = field("razorpay_subscription_id");
  const orderId = field("razorpay_order_id");
  if (!paymentId || !signature) {
    return bounce({ payment: "failed", reason: errorDescription ?? "Payment was not completed" });
  }

  const limited = await enforceRateLimit("payment", req, paymentId);
  if (limited) return bounce({ payment: "failed", reason: "Too many attempts — try again shortly" });

  // Resolve the paying user from our own record of the gateway id.
  const userId = await findSubscriptionOwner({
    razorpaySubscriptionId: subscriptionId,
    razorpayOrderId: orderId,
  });
  if (!userId) return bounce({ payment: "failed", reason: "Subscription not found" });

  const profile = await getUserCheckout(userId).catch(() => null);

  const result = await activateVerifiedPayment({
    userId,
    userEmail: profile?.email ?? null,
    userName: profile?.name ?? null,
    razorpayOrderId: orderId,
    razorpaySubscriptionId: subscriptionId,
    razorpayPaymentId: paymentId,
    razorpaySignature: signature,
  });

  if (!result.ok) return bounce({ payment: "failed", reason: result.error });
  return bounce({ payment: "success", ref: paymentId });
}
