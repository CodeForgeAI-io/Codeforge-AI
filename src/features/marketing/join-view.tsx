"use client";

import Link from "next/link";
import {
  CheckCircle2, Circle, Sparkles, ShieldCheck, CreditCard, Calendar, ArrowRight,
} from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { RegisterForm } from "@/features/auth/register-form";
import AnimatedContent from "@/components/reactbits/AnimatedContent";
import { MarketingHeader, MarketingFooter, pageCls } from "./chrome";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";

interface FeatureRow { label: string; description: string; included: boolean }
interface Group { group: string; items: FeatureRow[] }

export function JoinView({
  campaign, planName, price, groups, signedIn, google, github,
}: {
  campaign: { code: string; plan: string; cycle: string; trialDays: number; headline: string; blurb: string };
  planName: string;
  price: number;
  groups: Group[];
  signedIn: boolean;
  google: boolean;
  github: boolean;
}) {
  const checkout = `/checkout?plan=${campaign.plan}&cycle=${campaign.cycle}&trial=1&campaign=${campaign.code}`;
  const firstCharge = new Date(Date.now() + campaign.trialDays * 86_400_000).toLocaleDateString(undefined, {
    day: "numeric", month: "long", year: "numeric",
  });
  const included = groups.flatMap((g) => g.items).filter((i) => i.included).length;
  const perCycle = campaign.cycle === "yearly" ? "year" : "month";

  return (
    <div className={cn("min-h-svh", pageCls)}>
      <MarketingHeader signedIn={signedIn} />

      {/* ── Split hero: offer (left) + sign-up (right) ─────────────────── */}
      <section className="relative overflow-hidden border-b pt-20">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(900px 460px at 15% -10%, color-mix(in srgb, #006bff 16%, transparent), transparent 70%)",
          }}
        />
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:gap-14 lg:py-16">
          {/* Offer */}
          <div className="flex flex-col justify-center">
            <Badge className="mb-4 w-fit border-[#006bff]/20 bg-[#006bff]/10 text-[#006bff]" variant="secondary">
              <Sparkles className="mr-1 size-3" /> Offer applied · {campaign.code}
            </Badge>
            <h1 className="text-balance text-4xl font-bold tracking-[-0.03em] sm:text-5xl">
              {campaign.headline}
            </h1>
            <p className="mt-4 max-w-md text-balance text-muted-foreground sm:text-lg">{campaign.blurb}</p>

            {/* Offer timeline */}
            <div className="mt-7 space-y-3">
              <Step icon={<CreditCard className="size-4" />} step="Today" title="₹1 authorisation"
                body="You approve an auto-pay mandate. Razorpay authorises ₹1 to verify your card or UPI — it's refunded, and the plan itself costs nothing." />
              <Step icon={<Sparkles className="size-4" />} step={`Next ${campaign.trialDays} days`} title={`${planName} — free`} accent
                body="Full access to everything below. ₹0 charged. Cancel any time and you'll never be billed." />
              <Step icon={<Calendar className="size-4" />} step={firstCharge} title={`₹${price}/${perCycle} begins`}
                body={`If you haven't cancelled, auto-pay renews at ₹${price}. Cancel before this date and pay nothing.`} />
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="size-3.5 text-easy" /> Secured by Razorpay</span>
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="size-3.5 text-easy" /> Cancel in one click</span>
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="size-3.5 text-easy" /> {included} features unlocked</span>
            </div>
          </div>

          {/* Sign-up / continue */}
          <div className="lg:pl-4">
            <Card className="border shadow-lg shadow-[#006bff]/5">
              <CardContent className="p-6 sm:p-7">
                {signedIn ? (
                  <div className="text-center">
                    <span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-[#006bff]/10 text-[#006bff]">
                      <Sparkles className="size-5" />
                    </span>
                    <h2 className="mt-4 text-xl font-bold tracking-tight">You&apos;re signed in</h2>
                    <p className="mt-1.5 text-sm text-muted-foreground">
                      One step left — approve auto-pay and your free month starts immediately.
                    </p>
                    <Button asChild size="lg" className="mt-5 h-12 w-full text-base">
                      <Link href={checkout}>Start my free month <ArrowRight className="size-4" /></Link>
                    </Button>
                    <p className="mt-3 text-xs text-muted-foreground">
                      ₹1 refundable today · ₹0 for {campaign.trialDays} days · cancel anytime
                    </p>
                  </div>
                ) : (
                  <>
                    <RegisterForm google={google} github={github} callbackUrl={checkout} />
                    <p className="mt-4 rounded-lg border border-dashed bg-muted/30 px-3 py-2 text-center text-xs text-muted-foreground">
                      Create your account, then approve auto-pay to unlock{" "}
                      <span className="font-medium text-foreground">{campaign.trialDays} free days of {planName}</span>.
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ── Scroll-stack features ──────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-4 pt-12 sm:px-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Everything you unlock</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
            Every feature and AI tool in {planName} — free for {campaign.trialDays} days. Scroll through.
          </p>
        </div>
      </section>

      {/* CSS sticky stacking — same pattern as the homepage workflow section:
          each card pins slightly lower than the previous one and they pile up
          as you scroll. No JS, no dead space, works on every device. */}
      <div className="mx-auto mt-8 w-full max-w-4xl px-4 pb-16 sm:px-6">
        {groups.map((g, i) => (
          <div key={g.group} className="sticky mb-6" style={{ top: 84 + i * 26, zIndex: i + 1 }}>
            <div className="rounded-3xl border bg-card p-6 shadow-[0_24px_80px_rgba(15,23,42,0.14)] dark:shadow-[0_24px_80px_rgba(0,0,0,0.55)] sm:p-8">
              <h3 className="flex items-center gap-2 text-lg font-bold tracking-tight sm:text-xl">
                <span className="flex size-8 items-center justify-center rounded-lg bg-[#006bff]/10 text-[#006bff]">
                  <Sparkles className="size-4" />
                </span>
                {g.group}
              </h3>
              <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
                {g.items.map((f) => (
                  <li key={f.label} className="flex items-start gap-2.5">
                    {f.included ? (
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-easy" />
                    ) : (
                      <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground/40" />
                    )}
                    <div className="min-w-0">
                      <p className={cn("text-sm font-medium", !f.included && "text-muted-foreground/60")}>{f.label}</p>
                      <p className="text-xs text-muted-foreground">{f.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* ── FAQ + closing CTA ──────────────────────────────────────────── */}
      <div className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
        <AnimatedContent distance={40} duration={0.6}>
          <section>
            <h2 className="text-xl font-semibold tracking-tight">Questions</h2>
            <div className="mt-4 divide-y rounded-xl border">
              <Faq q="Will I be charged today?" a={`No. Razorpay authorises ₹1 to set up the auto-pay mandate and refunds it. The plan costs ₹0 for the first ${campaign.trialDays} days.`} />
              <Faq q="What happens after the free month?" a={`On ${firstCharge}, auto-pay charges ₹${price}. We email you before it happens, and you can cancel any time until then.`} />
              <Faq q="How do I cancel?" a="Settings → Billing → Cancel. One click, works during the free month, and you keep access until the period ends." />
              <Faq q="Why do you need a card for a free month?" a="Auto-pay is what lets your access continue seamlessly after the free month. It also keeps the offer fair — one free month per account." />
            </div>
          </section>

          <section className="mt-10 rounded-2xl border bg-muted/30 p-8 text-center">
            <h2 className="text-2xl font-bold tracking-tight">Start your free month of {planName}</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              {campaign.trialDays} days free, then ₹{price}/{perCycle}. Cancel anytime — no questions.
            </p>
            <Button asChild size="lg" className="mt-5 h-12 w-full max-w-xs text-base">
              <Link href={signedIn ? checkout : `/register?callbackUrl=${encodeURIComponent(checkout)}`}>
                Claim {campaign.code} <ArrowRight className="size-4" />
              </Link>
            </Button>
            <p className="mt-3 text-xs text-muted-foreground">
              {signedIn ? "You're signed in — this takes about a minute." : `Free ${APP_NAME} account required.`}
            </p>
          </section>
        </AnimatedContent>
      </div>

      <MarketingFooter />
    </div>
  );
}

function Step({ icon, step, title, body, accent }: {
  icon: React.ReactNode; step: string; title: string; body: string; accent?: boolean;
}) {
  return (
    <div className={cn("flex gap-3 rounded-xl border p-3.5", accent && "border-[#006bff]/30 bg-[#006bff]/5")}>
      <span className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-lg",
        accent ? "bg-[#006bff]/15 text-[#006bff]" : "bg-muted text-muted-foreground",
      )}>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{step}</p>
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <details className="group px-4 py-3.5">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium">
        {q}
        <span className="text-muted-foreground transition-transform group-open:rotate-45">+</span>
      </summary>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{a}</p>
    </details>
  );
}
