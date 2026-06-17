import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models";
import { sendEmail } from "@/lib/mailer";
import {
  resetPasswordEmailHtml,
  resetPasswordEmailSubject,
} from "@/lib/email-templates";
import { forgotPasswordSchema } from "@/schemas/auth";
import { enforceRateLimit } from "@/lib/rate-limit";

const EXPIRY_MINUTES = 60;

export async function POST(req: NextRequest) {
  const limited = await enforceRateLimit("auth", req);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  await connectDB();
  const user = await User.findOne({ email: parsed.data.email.toLowerCase() })
    .select("name email")
    .lean();

  // Always return success to avoid user enumeration
  if (!user) {
    return NextResponse.json({ ok: true });
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiry = new Date(Date.now() + EXPIRY_MINUTES * 60 * 1000);

  await User.updateOne(
    { _id: user._id },
    { passwordResetToken: token, passwordResetExpiry: expiry },
  );

  const appUrl =
    process.env.NEXTAUTH_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000";
  const resetUrl = `${appUrl}/reset-password?token=${token}`;

  try {
    await sendEmail({
      to: user.email,
      subject: resetPasswordEmailSubject,
      html: resetPasswordEmailHtml({
        name: user.name,
        resetUrl,
        expiryMinutes: EXPIRY_MINUTES,
      }),
    });
  } catch (err) {
    // Surface the real reason in server logs (e.g. missing SMTP_* env vars)
    // instead of crashing with an opaque 500.
    console.error("[forgot-password] Failed to send reset email:", err);
    return NextResponse.json(
      { error: "Could not send the reset email. Please try again later." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
