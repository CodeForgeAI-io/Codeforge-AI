import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models";
import { PLANS } from "@/lib/plans";
import { CheckoutForm } from "@/features/subscription/checkout-form";

export const metadata: Metadata = { title: "Checkout" };
export const dynamic = "force-dynamic";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; cycle?: string }>;
}) {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login?callbackUrl=/pricing");

  const { plan: planParam, cycle: cycleParam } = await searchParams;
  const plan = planParam === "go" || planParam === "plus" ? planParam : null;
  const cycle = cycleParam === "yearly" ? "yearly" : "monthly";
  if (!plan) redirect("/pricing");

  if (!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)) {
    redirect("/pricing");
  }

  await connectDB();
  const user = await User.findById(session.user.id)
    .select("name email billing")
    .lean();
  if (!user) redirect("/login");

  const def = PLANS[plan];
  const amount = cycle === "yearly" ? def.price.yearly : def.price.monthly;

  return (
    <CheckoutForm
      plan={plan}
      cycle={cycle}
      amount={amount}
      planName={def.name}
      trialDays={def.trialDays}
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
