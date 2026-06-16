import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models";
import { PublicHeader } from "@/components/layout/public-header";
import { PricingCards } from "@/features/subscription/pricing-cards";
import { ShieldCheck, RefreshCw, HeadphonesIcon } from "lucide-react";

export const metadata: Metadata = {
  title: "Pricing — CodeForge AI",
  description: "Simple, transparent pricing. Start free, upgrade anytime.",
};
export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const session = await auth();
  const signedIn = !!session?.user;

  let currentPlan = "free";
  if (session?.user?.id) {
    await connectDB();
    const user = await User.findById(session.user.id).select("plan").lean();
    currentPlan = user?.plan ?? "free";
  }

  return (
    <div className="min-h-svh bg-background">
      <PublicHeader signedIn={signedIn} />

      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        {/* header */}
        <div className="mb-10 text-center">
          <span className="inline-flex items-center rounded-full border bg-primary/5 px-3 py-1 text-xs font-semibold text-primary mb-3">
            Simple, transparent pricing
          </span>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Start free, level up fast
          </h1>
          <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
            Every plan includes a 7-day free trial on paid tiers. No credit card required to start.
          </p>
        </div>

        <PricingCards currentPlan={currentPlan} />

        {/* trust badges */}
        <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-primary" /> Secure payments via Razorpay
          </span>
          <span className="flex items-center gap-2">
            <RefreshCw className="size-4 text-primary" /> Cancel anytime, no questions asked
          </span>
          <span className="flex items-center gap-2">
            <HeadphonesIcon className="size-4 text-primary" /> Priority support on Plus
          </span>
        </div>

        {/* FAQ */}
        <div className="mt-14 mx-auto max-w-2xl">
          <h2 className="text-xl font-bold text-center mb-6">Frequently asked questions</h2>
          <div className="space-y-3">
            {[
              { q: "Do I need a credit card for the free trial?", a: "No. Your 7-day free trial starts without any payment. You'll only be charged if you subscribe after the trial." },
              { q: "Can I switch plans?", a: "Yes. You can upgrade or downgrade at any time from Settings → Billing. Upgrades take effect immediately." },
              { q: "What happens when my trial ends?", a: "You'll automatically move to the Free plan. Your data is kept; you just lose access to paid features until you subscribe." },
              { q: "Is my payment information secure?", a: "All payments are processed through Razorpay, a PCI-DSS compliant payment gateway. We never store your card details." },
              { q: "Can I get a refund?", a: "We offer a 3-day refund window from the date of payment. Contact support and we'll process it right away." },
            ].map(({ q, a }) => (
              <details key={q} className="group rounded-xl border p-4 cursor-pointer">
                <summary className="flex items-center justify-between font-medium text-sm list-none">
                  {q}
                  <span className="ml-2 text-muted-foreground transition-transform group-open:rotate-180">↓</span>
                </summary>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
