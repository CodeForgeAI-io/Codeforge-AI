import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getUserCheckout } from "@/services/user-store";
import { PLANS } from "@/lib/plans";
import { getCampaign } from "@/lib/campaigns";
import { CheckoutForm } from "@/features/subscription/checkout-form";

export const metadata: Metadata = { title: "Checkout" };
export const dynamic = "force-dynamic";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; cycle?: string; trial?: string; code?: string; campaign?: string }>;
}) {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login?callbackUrl=/pricing");

  const {
    plan: planParam,
    cycle: cycleParam,
    trial: trialParam,
    code,
    campaign: campaignParam,
  } = await searchParams;
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

  // A /join campaign code extends the trial for this plan+cycle. The billing
  // route re-resolves it server-side; this only drives what we display.
  const campaign = getCampaign(campaignParam);
  const campaignApplies = campaign?.plan === plan && campaign?.cycle === cycle;
  const trialDays = campaignApplies ? campaign.trialDays : def.trialDays;

  // A card-on-file trial is offered only to accounts that never trialed.
  const trialEligible = trialDays > 0 && !user.trialEndsAt;

  return (
    <CheckoutForm
      plan={plan}
      cycle={cycle}
      amount={amount}
      planName={def.name}
      trialDays={trialDays}
      trialEligible={trialEligible}
      initialTrial={trialParam === "1" || trialParam === "true"}
      initialCouponCode={code ?? ""}
      campaign={campaignApplies ? campaign.code : undefined}
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
