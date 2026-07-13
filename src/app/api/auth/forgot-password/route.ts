import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/mailer";
import { resetPasswordEmailHtml, resetPasswordEmailSubject } from "@/lib/email-templates";
import { forgotPasswordSchema } from "@/schemas/auth";
import { enforceRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const EXPIRY_MINUTES = 60;

/**
 * Send a password-reset email. Uses Supabase Auth's recovery token
 * (admin.generateLink) delivered in our own branded email. The link carries the
 * `token_hash` to /reset-password, which calls verifyOtp to establish a recovery
 * session client-side (the implicit-hash + /auth/callback route can't, since a
 * server route never sees the URL fragment).
 */
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
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const admin = supabaseAdmin();

  const { data, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo: `${appUrl}/reset-password` },
  });

  // Always report success so we never reveal whether the account exists.
  if (error || !data?.properties?.hashed_token) {
    return NextResponse.json({ ok: true });
  }

  // Link straight to our reset page with the recovery token_hash — the page
  // verifies it (verifyOtp) to establish the session, then updates the password.
  const resetUrl = `${appUrl}/reset-password?token_hash=${encodeURIComponent(
    data.properties.hashed_token,
  )}&type=recovery`;

  const { data: profile } = await admin.from("users").select("name").eq("email", email).maybeSingle();
  const name = (profile as { name?: string } | null)?.name || "there";

  try {
    await sendEmail({
      to: email,
      subject: resetPasswordEmailSubject,
      html: resetPasswordEmailHtml({ name, resetUrl, expiryMinutes: EXPIRY_MINUTES }),
    });
  } catch (err) {
    console.error("[forgot-password] Failed to send reset email:", err);
    return NextResponse.json({ error: "Could not send the reset email. Please try again later." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
