import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { PublicHeader } from "@/components/layout/public-header";
import { JoinView } from "@/features/marketing/join-view";
import { getCampaign, defaultCampaign } from "@/lib/campaigns";
import { PLANS } from "@/lib/plans";
import { FEATURE_CATALOG } from "@/lib/feature-catalog";
import { APP_NAME } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}): Promise<Metadata> {
  const { code } = await searchParams;
  const campaign = getCampaign(code) ?? defaultCampaign();
  const title = campaign ? campaign.headline : `Join ${APP_NAME}`;
  const description = campaign
    ? `${campaign.blurb} Then ₹${PLANS[campaign.plan].price.monthly}/month — cancel anytime.`
    : `Start practising coding interviews with ${APP_NAME}.`;
  return {
    title,
    description,
    alternates: { canonical: "/join" },
    openGraph: { type: "website", title: `${title} · ${APP_NAME}`, description },
  };
}

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;
  const session = await auth();

  // The code auto-applies from the link; without one we show the default offer.
  const campaign = getCampaign(code) ?? defaultCampaign();
  if (!campaign) redirect("/pricing");

  const plan = PLANS[campaign.plan];
  const price = campaign.cycle === "yearly" ? plan.price.yearly : plan.price.monthly;

  // Every feature the offer unlocks, grouped as in the catalog.
  const groups = [...new Set(FEATURE_CATALOG.map((f) => f.group))].map((group) => ({
    group,
    items: FEATURE_CATALOG.filter((f) => f.group === group).map((f) => ({
      label: f.label,
      description: f.description,
      // Included when the plan on offer meets the feature's minimum.
      included: f.defaultMinPlan === "free" || f.defaultMinPlan === campaign.plan,
    })),
  }));

  return (
    <div className="min-h-svh bg-background">
      <PublicHeader signedIn={!!session?.user} />
      <JoinView
        campaign={{
          code: campaign.code,
          plan: campaign.plan,
          cycle: campaign.cycle,
          trialDays: campaign.trialDays,
          headline: campaign.headline,
          blurb: campaign.blurb,
        }}
        planName={plan.name}
        price={price}
        groups={groups}
        signedIn={!!session?.user}
        google={!!process.env.GOOGLE_CLIENT_ID}
        github={!!process.env.GITHUB_CLIENT_ID}
      />
    </div>
  );
}
