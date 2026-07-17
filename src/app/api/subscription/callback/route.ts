import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { activateVerifiedPayment } from "@/services/billing-activate";

export const runtime = "nodejs";

/**
 * Razorpay hosted-checkout callback (full-page redirect flow, no popup).
 *
 * Razorpay POSTs the payment result here as a top-level browser navigation, so
 * the user's session cookies ride along. Security: the session identifies the
 * user and the HMAC signature proves the payment — the cross-origin POST body
 * itself is never trusted (this path is exempted from the same-origin guard for
 * exactly that reason). On success we activate and bounce back to /checkout's
 * receipt screen; on failure we bounce back with the reason.
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

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(
      new URL(`/login?callbackUrl=${encodeURIComponent(`/checkout?${back}`)}`, req.url),
      303,
    );
  }

  const limited = await enforceRateLimit("payment", req, session.user.id);
  if (limited) return bounce({ payment: "failed", reason: "Too many attempts — try again shortly" });

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
  if (!paymentId || !signature) {
    return bounce({ payment: "failed", reason: errorDescription ?? "Payment was not completed" });
  }

  const result = await activateVerifiedPayment({
    userId: session.user.id,
    userEmail: session.user.email ?? null,
    userName: session.user.name ?? null,
    razorpayOrderId: field("razorpay_order_id"),
    razorpaySubscriptionId: field("razorpay_subscription_id"),
    razorpayPaymentId: paymentId,
    razorpaySignature: signature,
  });

  if (!result.ok) return bounce({ payment: "failed", reason: result.error });
  return bounce({ payment: "success", ref: paymentId });
}
