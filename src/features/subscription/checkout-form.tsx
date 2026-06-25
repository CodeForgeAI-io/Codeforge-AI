"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { ArrowLeft, Crown, Loader2, Lock, ShieldCheck, Sparkles, Zap } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPrice } from "@/lib/plans";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    Razorpay: new (opts: Record<string, unknown>) => { open(): void };
  }
}

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

interface Defaults {
  name: string;
  email: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export function CheckoutForm({
  plan,
  cycle,
  amount,
  planName,
  trialDays,
  defaults,
}: {
  plan: "go" | "plus";
  cycle: "monthly" | "yearly";
  amount: number;
  planName: string;
  trialDays: number;
  defaults: Defaults;
}) {
  const router = useRouter();
  const { data: session, update } = useSession();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<Defaults>(defaults);

  const PlanIcon = plan === "plus" ? Crown : Zap;
  const set = (k: keyof Defaults) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  function validate(): string | null {
    if (!form.name.trim()) return "Please enter your name";
    if (!/^\+?[0-9\s-]{7,15}$/.test(form.phone.trim())) return "Please enter a valid phone number";
    if (!form.line1.trim()) return "Please enter your address";
    if (!form.city.trim()) return "Please enter your city";
    if (!form.postalCode.trim()) return "Please enter your postal code";
    return null;
  }

  async function pay() {
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    setLoading(true);
    try {
      const ok = await loadRazorpay();
      if (!ok) throw new Error("Failed to load payment gateway");

      const billing = {
        phone: form.phone.trim(),
        line1: form.line1.trim(),
        line2: form.line2.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        postalCode: form.postalCode.trim(),
        country: form.country.trim() || "IN",
      };

      const res = await fetch("/api/subscription/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, cycle, billing }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not start subscription");

      const rzp = new window.Razorpay({
        key: data.key,
        subscription_id: data.subscriptionId,
        name: "CodeForge AI",
        description: `${planName} — ${cycle} (auto-renews)`,
        image: `${window.location.origin}/icon-192.png`,
        theme: { color: "#006bff" },
        // Prefilled so Razorpay skips the contact/email step and goes straight
        // to the payment apps (UPI / cards / netbanking).
        prefill: {
          name: form.name.trim(),
          email: form.email.trim() || session?.user?.email || "",
          contact: form.phone.trim(),
        },
        notes: {
          address: [billing.line1, billing.city, billing.state, billing.postalCode]
            .filter(Boolean)
            .join(", "),
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_subscription_id: string;
          razorpay_signature: string;
        }) => {
          const verify = await fetch("/api/subscription/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpaySubscriptionId: response.razorpay_subscription_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            }),
          });
          const v = await verify.json();
          if (verify.ok) {
            toast.success(`Welcome to ${planName}! Auto-pay is on.`);
            await update();
            router.push("/settings?tool=billing");
            router.refresh();
          } else {
            toast.error(v.error ?? "Payment verification failed");
            setLoading(false);
          }
        },
      });
      rzp.open();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Payment failed");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <button
        onClick={() => router.push("/pricing")}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to plans
      </button>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* billing details */}
        <div className="rounded-2xl border bg-card p-6">
          <h1 className="text-lg font-semibold tracking-tight">Billing details</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            We use these for your invoice and to skip re-entering them at payment.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Full name" className="sm:col-span-2">
              <Input value={form.name} onChange={set("name")} placeholder="Jane Doe" />
            </Field>
            <Field label="Email">
              <Input value={form.email} onChange={set("email")} type="email" placeholder="jane@email.com" />
            </Field>
            <Field label="Phone">
              <Input value={form.phone} onChange={set("phone")} placeholder="+91 98765 43210" inputMode="tel" />
            </Field>
            <Field label="Address line 1" className="sm:col-span-2">
              <Input value={form.line1} onChange={set("line1")} placeholder="Flat / Street" />
            </Field>
            <Field label="Address line 2 (optional)" className="sm:col-span-2">
              <Input value={form.line2} onChange={set("line2")} placeholder="Area / Landmark" />
            </Field>
            <Field label="City">
              <Input value={form.city} onChange={set("city")} placeholder="Chennai" />
            </Field>
            <Field label="State">
              <Input value={form.state} onChange={set("state")} placeholder="Tamil Nadu" />
            </Field>
            <Field label="Postal code">
              <Input value={form.postalCode} onChange={set("postalCode")} placeholder="600001" inputMode="numeric" />
            </Field>
            <Field label="Country">
              <Input value={form.country} onChange={set("country")} placeholder="IN" maxLength={2} />
            </Field>
          </div>
        </div>

        {/* order summary */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-2xl border bg-card p-6">
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                <PlanIcon className="size-4.5 text-primary" />
              </span>
              <div>
                <h2 className="text-sm font-semibold">{planName} plan</h2>
                <p className="text-xs capitalize text-muted-foreground">{cycle} · auto-renews</p>
              </div>
            </div>

            <div className="mt-5 space-y-2 border-t pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{planName} ({cycle})</span>
                <span className="font-medium tabular-nums">{formatPrice(amount)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 text-base font-semibold">
                <span>Total due today</span>
                <span className="tabular-nums">{formatPrice(amount)}</span>
              </div>
            </div>

            {trialDays > 0 && (
              <p className="mt-3 flex items-center gap-1.5 text-xs text-primary">
                <Sparkles className="size-3.5" /> {trialDays}-day free trial for new users
              </p>
            )}

            <Button onClick={pay} disabled={loading} size="lg" className="mt-5 w-full gap-2">
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />}
              {loading ? "Opening payment…" : `Pay ${formatPrice(amount)}`}
            </Button>

            <div className="mt-4 space-y-1.5 text-[11px] text-muted-foreground">
              <p className="flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-primary" /> Secured by Razorpay · 256-bit encryption
              </p>
              <p className={cn("flex items-center gap-1.5")}>
                <Lock className="size-3.5 text-primary" /> UPI, cards & netbanking · cancel anytime
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
