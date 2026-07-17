import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getUserCheckout } from "@/services/user-store";
import { PLANS } from "@/lib/plans";
import { getCampaign } from "@/lib/campaigns";
import { CheckoutForm } from "@/features/subscription/checkout-form";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { ShieldCheck } from "@/components/icons";

export const metadata: Metadata = { title: "Checkout" };
export const dynamic = "force-dynamic";

// NOTE: this page deliberately lives OUTSIDE the (platform) route group: its
// layout gates on onboarding, which would bounce brand-new signups (e.g. from
// the /join offer) to /onboarding before they could approve auto-pay. Checkout
// only needs a session; onboarding happens right after payment instead.

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; cycle?: string; trial?: string; code?: string; campaign?: string }>;
}) {
  const {
    plan: planParam,
    cycle: cycleParam,
    trial: trialParam,
    code,
    campaign: campaignParam,
  } = await searchParams;

  const session = await getSession();
  if (!session?.user?.id) {
    // Preserve the full offer (plan/trial/campaign) through the login round-trip.
    const qs = new URLSearchParams(
      Object.entries({ plan: planParam, cycle: cycleParam, trial: trialParam, code, campaign: campaignParam })
        .filter(([, v]) => v != null) as [string, string][],
    ).toString();
    redirect(`/login?callbackUrl=${encodeURIComponent(`/checkout${qs ? `?${qs}` : ""}`)}`);
  }
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
    <div className="min-h-svh bg-background">
      <header className="flex h-14 items-center justify-between border-b px-4 sm:px-6">
        <Logo href="/dashboard" />
        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:inline-flex">
            <ShieldCheck className="size-3.5 text-easy" /> Secure checkout · Razorpay
          </span>
          <ThemeToggle />
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
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
      </main>
    </div>
  );
}
