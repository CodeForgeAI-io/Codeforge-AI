import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getUserCheckout } from "@/services/user-store";
import { PLANS } from "@/lib/plans";
import { CheckoutForm } from "@/features/subscription/checkout-form";

export const metadata: Metadata = { title: "Checkout" };
export const dynamic = "force-dynamic";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; cycle?: string; trial?: string }>;
}) {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login?callbackUrl=/pricing");

  const { plan: planParam, cycle: cycleParam, trial: trialParam } = await searchParams;
  const plan = planParam === "go" || planParam === "plus" ? planParam : null;
  const cycle = cycleParam === "yearly" ? "yearly" : "monthly";
  if (!plan) redirect("/pricing");

  if (!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)) {
    redirect("/pricing");
  }

  const user = await getUserCheckout(session.user.id);
  if (!user) redirect("/login");

  const def = PLANS[plan];
  const amount = cycle === "yearly" ? def.price.yearly : def.price.monthly;
  // A card-on-file trial is offered only to accounts that never trialed.
  const trialEligible = def.trialDays > 0 && !user.trialEndsAt;

  return (
    <CheckoutForm
      plan={plan}
      cycle={cycle}
      amount={amount}
      planName={def.name}
      trialDays={def.trialDays}
      trialEligible={trialEligible}
      initialTrial={trialParam === "1" || trialParam === "true"}
      defaults={{
        name: user.name ?? "",
        email: user.email ?? "",
        phone: user.billing?.phone ?? "",
        line1: user.billing?.line1 ?? "",
        line2: user.billing?.line2 ?? "",
        city: user.billing?.city ?? "",
        state: user.billing?.state ?? "",
        postalCode: user.billing?.postalCode ?? "",
        country: user.billing?.country ?? "IN",
      }}
    />
  );
}
