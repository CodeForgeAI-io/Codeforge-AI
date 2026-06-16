import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireUser } from "@/lib/api-auth";
import { User } from "@/models";
import { PLANS } from "@/lib/plans";

export async function POST(req: NextRequest) {
  const { session, error } = await requireUser();
  if (error) return error;

  const { plan } = await req.json();
  if (plan !== "go" && plan !== "plus") {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  await connectDB();
  const user = await User.findById(session.user.id).select("plan trialEndsAt createdAt").lean();
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Only allow trial once per account
  if (user.trialEndsAt) {
    return NextResponse.json({ error: "Trial already used" }, { status: 409 });
  }

  const trialDays = PLANS[plan].trialDays;
  const trialEndsAt = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);

  await User.findByIdAndUpdate(session.user.id, {
    plan,
    trialEndsAt,
    planExpiresAt: trialEndsAt,
  });

  return NextResponse.json({ ok: true, plan, trialEndsAt });
}
