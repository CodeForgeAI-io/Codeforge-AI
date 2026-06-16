import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireUser } from "@/lib/api-auth";
import { User } from "@/models";

export async function POST() {
  const { session, error } = await requireUser();
  if (error) return error;

  await connectDB();
  // Keep access until planExpiresAt, just don't renew
  await User.findByIdAndUpdate(session.user.id, {
    billingCycle: null,
    // plan stays active until expiry; a cron/check will downgrade after
  });

  return NextResponse.json({ ok: true, message: "Subscription cancelled. Access continues until your billing period ends." });
}
