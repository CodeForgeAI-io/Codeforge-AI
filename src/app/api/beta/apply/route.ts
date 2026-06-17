import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models";
import { sendEmail } from "@/lib/mailer";
import { betaWelcomeEmailHtml, betaWelcomeEmailSubject } from "@/lib/email-templates";
import { BETA_LIMIT } from "../join/route";

// Called after Google OAuth on /beta/success to apply Go plan if slots available
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  await connectDB();

  const user = await User.findById(session.user.id).select("name email plan betaUser planExpiresAt");
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Already a beta user — just confirm
  if (user.betaUser) {
    const betaCount = await User.countDocuments({ betaUser: true });
    return NextResponse.json({ ok: true, spotsLeft: Math.max(0, BETA_LIMIT - betaCount) });
  }

  const betaCount = await User.countDocuments({ betaUser: true });
  if (betaCount >= BETA_LIMIT) {
    return NextResponse.json({ ok: false, error: "All 50 beta spots have been claimed." });
  }

  const planExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await User.findByIdAndUpdate(session.user.id, {
    plan: "go",
    planExpiresAt,
    betaUser: true,
  });

  const spotsLeft = Math.max(0, BETA_LIMIT - betaCount - 1);
  const appUrl = process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const expiryStr = planExpiresAt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  sendEmail({
    to: user.email,
    subject: betaWelcomeEmailSubject(user.name),
    html: betaWelcomeEmailHtml({ name: user.name, dashboardUrl: `${appUrl}/dashboard`, spotsLeft, planExpiresAt: expiryStr }),
  }).catch(() => {});

  return NextResponse.json({ ok: true, spotsLeft });
}
