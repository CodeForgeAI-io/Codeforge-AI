export type PlanId = "free" | "go" | "plus";
export type BillingCycle = "monthly" | "yearly";

export interface PlanFeature {
  text: string;
  included: boolean;
}

export interface Plan {
  id: PlanId;
  name: string;
  tagline: string;
  badge?: string;
  badgeClass: string;
  price: { monthly: number; yearly: number };
  trialDays: number;
  limits: {
    aiCallsPerDay: number;      // -1 = unlimited
    bookmarks: number;          // -1 = unlimited
    notes: number;              // -1 = unlimited
    problemGenPerMonth: number; // -1 = unlimited
  };
  features: PlanFeature[];
  highlighted?: boolean;
  cta: string;
}

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    tagline: "Get started, no card needed",
    badge: "FREE",
    badgeClass: "bg-muted text-muted-foreground border",
    price: { monthly: 0, yearly: 0 },
    trialDays: 0,
    limits: { aiCallsPerDay: 3, bookmarks: 10, notes: 5, problemGenPerMonth: 20 },
    cta: "Get started free",
    features: [
      { text: "50 practice problems", included: true },
      { text: "Community forum (read-only)", included: true },
      { text: "10 bookmarks", included: true },
      { text: "Basic progress tracking", included: true },
      { text: "Unlimited problems", included: false },
      { text: "Spaced repetition (SM-2)", included: false },
      { text: "Company prep lists", included: false },
      { text: "Mock interview simulator", included: false },
      { text: "Billing & usage dashboard", included: false },
    ],
  },
  go: {
    id: "go",
    name: "Go",
    tagline: "For serious interview prep",
    badge: "GO",
    badgeClass: "bg-blue-500 text-white",
    price: { monthly: 49, yearly: 490 },
    trialDays: 7,
    highlighted: true,
    limits: { aiCallsPerDay: 20, bookmarks: -1, notes: -1, problemGenPerMonth: 50 },
    cta: "Start 7-day free trial",
    features: [
      { text: "All problems + solutions", included: true },
      { text: "Unlimited bookmarks & notes", included: true },
      { text: "Spaced repetition (SM-2)", included: true },
      { text: "Company prep lists", included: true },
      { text: "Skill analytics dashboard", included: true },
      { text: "Billing & usage dashboard", included: true },
      { text: "Downloadable invoices", included: true },
      { text: "Mock interview simulator", included: false },
      { text: "AI pair programmer", included: false },
    ],
  },
  plus: {
    id: "plus",
    name: "Plus",
    tagline: "Everything, unlimited",
    badge: "PLUS",
    badgeClass: "bg-primary text-primary-foreground",
    price: { monthly: 99, yearly: 990 },
    trialDays: 7,
    limits: { aiCallsPerDay: -1, bookmarks: -1, notes: -1, problemGenPerMonth: -1 },
    cta: "Start 7-day free trial",
    features: [
      { text: "Everything in Go", included: true },
      { text: "AI pair programmer", included: true },
      { text: "Mock interview simulator", included: true },
      { text: "Advanced analytics & predictions", included: true },
      { text: "Contest generator", included: true },
      { text: "Project & resume reviewer", included: true },
      { text: "Downloadable invoices", included: true },
      { text: "Priority support", included: true },
      { text: "Early access to new features", included: true },
    ],
  },
};

/** Monthly AI-credit allowance for a plan (-1 = unlimited). */
export function monthlyCredits(plan: Plan): number {
  return plan.limits.aiCallsPerDay < 0 ? -1 : plan.limits.aiCallsPerDay * 30;
}

export function getPlanById(id?: string | null): Plan {
  return PLANS[(id as PlanId) ?? "free"] ?? PLANS.free;
}

export function yearlyDiscount(plan: Plan) {
  const saved = plan.price.monthly * 12 - plan.price.yearly;
  return saved;
}

export function formatPrice(amount: number) {
  if (amount === 0) return "Free";
  return `₹${amount}`;
}
