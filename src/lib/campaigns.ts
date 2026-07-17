import type { BillingCycle, PlanId } from "./plans";

/**
 * Marketing campaigns for the /join landing page.
 *
 * A campaign is a *trackable code that extends the card-on-file trial* — it
 * carries no discount on purpose. A discount would push the flow down the
 * coupon path, which grants a plan outright with no Razorpay subscription, and
 * we'd lose the auto-charge after the free period. Here the card is
 * authenticated up front (Razorpay's nominal ₹1 mandate), nothing is charged
 * during the trial, and the first real charge fires when the trial ends.
 *
 * Keep this file framework-free so both client and server can import it. It is
 * the single source of truth: the billing route re-resolves the code itself and
 * never trusts a client-supplied trial length.
 */

export interface Campaign {
  code: string;
  plan: Extract<PlanId, "go" | "plus">;
  cycle: BillingCycle;
  /** Free days before the first real charge. */
  trialDays: number;
  headline: string;
  blurb: string;
  active: boolean;
  /** ISO date; past = expired. */
  expiresAt?: string;
}

export const CAMPAIGNS: Campaign[] = [
  {
    code: "LAUNCH30",
    plan: "go",
    cycle: "monthly",
    trialDays: 30,
    headline: "1 month of Go — free",
    blurb: "Unlock every problem, all 9 AI tools and unlimited practice for 30 days.",
    active: true,
  },
];

/** The campaign used when /join is opened without a code. */
export const DEFAULT_CAMPAIGN_CODE = "LAUNCH30";

/** Resolve a code to a live campaign, or null. Case-insensitive. */
export function getCampaign(code: string | null | undefined): Campaign | null {
  if (!code) return null;
  const wanted = code.trim().toUpperCase();
  const c = CAMPAIGNS.find((x) => x.code === wanted);
  if (!c || !c.active) return null;
  if (c.expiresAt && Date.parse(c.expiresAt) < Date.now()) return null;
  return c;
}

/** The campaign /join shows by default (falls back to the first active one). */
export function defaultCampaign(): Campaign | null {
  return getCampaign(DEFAULT_CAMPAIGN_CODE) ?? CAMPAIGNS.find((c) => c.active) ?? null;
}
