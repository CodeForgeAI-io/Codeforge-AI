"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Check, Clock, X, Zap } from "@/components/icons";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PLANS, formatPrice, yearlyDiscount } from "@/lib/plans";
import type { PlanId, BillingCycle } from "@/lib/plans";
import { toast } from "sonner";

declare global {
  interface Window {
    Razorpay: new (opts: Record<string, unknown>) => { open(): void };
  }
}

const paymentsEnabled = !!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function PricingCards({
  cycle: defaultCycle = "monthly",
  currentPlan,
  onPlanChosen,
  compact = false,
}: {
  cycle?: BillingCycle;
  currentPlan?: string | null;
  onPlanChosen?: (plan: PlanId) => void;
  compact?: boolean;
}) {
  const [cycle, setCycle] = useState<BillingCycle>(defaultCycle);
  const [loading, setLoading] = useState<PlanId | null>(null);
  const { data: session } = useSession();
  const router = useRouter();

  async function startTrial(plan: PlanId) {
    if (!session) { router.push("/login?callbackUrl=/pricing"); return; }
    setLoading(plan);
    try {
      const res = await fetch("/api/subscription/start-trial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`${PLANS[plan].name} trial started! 7 days free.`);
      onPlanChosen?.(plan);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to start trial");
    } finally {
      setLoading(null);
    }
  }

  async function subscribe(plan: PlanId) {
    if (!session) { router.push("/login?callbackUrl=/pricing"); return; }
    setLoading(plan);
    try {
      const loaded = await loadRazorpay();
      if (!loaded) throw new Error("Failed to load payment gateway");

      const res = await fetch("/api/subscription/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, cycle }),
      });
      const order = await res.json();
      if (!res.ok) throw new Error(order.error);

      new window.Razorpay({
        key: order.key,
        amount: order.amount * 100,
        currency: order.currency,
        name: "CodeForge AI",
        description: `${PLANS[plan].name} — ${cycle}`,
        order_id: order.orderId,
        theme: { color: "#006bff" },
        prefill: { name: session.user.name, email: session.user.email },
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          const verify = await fetch("/api/subscription/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            }),
          });
          const v = await verify.json();
          if (verify.ok) {
            toast.success(`Upgraded to ${PLANS[plan].name}!`);
            onPlanChosen?.(plan);
            router.refresh();
          } else {
            toast.error(v.error ?? "Payment verification failed");
          }
        },
      }).open();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Payment failed");
    } finally {
      setLoading(null);
    }
  }

  const plans = [PLANS.free, PLANS.go, PLANS.plus] as const;

  return (
    <div className="space-y-6">
      {/* billing toggle */}
      <div className="flex justify-center">
        <div className="flex items-center gap-1 rounded-xl border bg-muted/40 p-1">
          <button
            onClick={() => setCycle("monthly")}
            className={cn("rounded-lg px-4 py-1.5 text-sm font-medium transition-colors", cycle === "monthly" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
          >
            Monthly
          </button>
          <button
            onClick={() => setCycle("yearly")}
            className={cn("flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-medium transition-colors", cycle === "yearly" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
          >
            Yearly
            <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">Save 2 months</span>
          </button>
        </div>
      </div>

      {/* cards */}
      <div className={cn("grid gap-4", compact ? "sm:grid-cols-3" : "mx-auto max-w-5xl sm:grid-cols-3")}>
        {plans.map((plan) => {
          const isCurrentPlan = currentPlan === plan.id;
          const isFree = plan.id === "free";
          const price = cycle === "yearly" ? plan.price.yearly : plan.price.monthly;
          const monthlyEquiv = cycle === "yearly" && !isFree ? Math.round(plan.price.yearly / 12) : null;
          const saving = !isFree ? yearlyDiscount(plan) : 0;

          return (
            <div
              key={plan.id}
              className={cn(
                "relative flex flex-col rounded-2xl border-2 p-6",
                plan.highlighted
                  ? "border-primary shadow-[0_0_0_1px] shadow-primary/20 bg-primary/3"
                  : "border-border bg-card",
              )}
            >
              {plan.highlighted && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
                    <Zap className="size-3" /> Most Popular
                  </span>
                </div>
              )}

              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn("inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold", plan.badgeClass)}>
                    {plan.badge}
                  </span>
                  {isCurrentPlan && (
                    <span className="rounded-full border border-primary/30 bg-primary/5 px-2 py-0.5 text-[10px] font-semibold text-primary">
                      Current plan
                    </span>
                  )}
                  {!isFree && !paymentsEnabled && !isCurrentPlan && (
                    <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-500">
                      Coming soon
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <p className="text-xs text-muted-foreground">{plan.tagline}</p>
              </div>

              <div className="mb-5">
                <div className="flex items-end gap-1">
                  <span className="text-3xl font-bold">{formatPrice(price)}</span>
                  {!isFree && <span className="mb-1 text-sm text-muted-foreground">/{cycle === "yearly" ? "yr" : "mo"}</span>}
                </div>
                {monthlyEquiv && (
                  <p className="text-xs text-muted-foreground">≈ ₹{monthlyEquiv}/mo · Save ₹{saving}</p>
                )}
                {!isFree && plan.trialDays > 0 && (
                  <p className="mt-1 text-xs font-medium text-primary">{plan.trialDays}-day free trial for new users</p>
                )}
              </div>

              <ul className="mb-6 flex-1 space-y-2">
                {plan.features.map((f, i) => (
                  <li key={i} className={cn("flex items-start gap-2 text-xs", !f.included && "opacity-40")}>
                    {f.included
                      ? <Check className="size-3.5 shrink-0 mt-0.5 text-primary" />
                      : <X className="size-3.5 shrink-0 mt-0.5" />}
                    {f.text}
                  </li>
                ))}
              </ul>

              {isFree ? (
                <Button
                  variant={isCurrentPlan ? "outline" : "secondary"}
                  className="w-full"
                  disabled={isCurrentPlan}
                  onClick={() => router.push(session ? "/dashboard" : "/register")}
                >
                  {isCurrentPlan ? "Current plan" : plan.cta}
                </Button>
              ) : isCurrentPlan ? (
                <Button variant="outline" className="w-full" disabled>
                  Current plan
                </Button>
              ) : !paymentsEnabled ? (
                <div className="space-y-2">
                  <Button className="w-full gap-2" disabled variant="outline">
                    <Clock className="size-4" /> Payments coming soon
                  </Button>
                  {plan.id === "go" && (
                    <Link href="/beta/join" className="block">
                      <Button className="w-full gap-1.5 border-blue-500/40 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20" variant="outline">
                        Get Go free via Beta →
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {plan.trialDays > 0 && (
                    <Button
                      className="w-full"
                      onClick={() => startTrial(plan.id)}
                      disabled={loading === plan.id}
                    >
                      {loading === plan.id ? "Starting trial…" : plan.cta}
                    </Button>
                  )}
                  <Button
                    variant={plan.trialDays > 0 ? "outline" : "default"}
                    className="w-full"
                    onClick={() => subscribe(plan.id)}
                    disabled={loading === plan.id}
                  >
                    {loading === plan.id ? "Processing…" : `Subscribe · ${formatPrice(price)}/${cycle === "yearly" ? "yr" : "mo"}`}
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
