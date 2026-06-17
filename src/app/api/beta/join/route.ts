import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models";
import { sendEmail } from "@/lib/mailer";
import { betaWelcomeEmailHtml, betaWelcomeEmailSubject } from "@/lib/email-templates";
import { enforceRateLimit } from "@/lib/rate-limit";
import { sanitizeUserContent, cap } from "@/lib/sanitize";
import { z } from "zod";

export const BETA_LIMIT = 50;

const betaSchema = z.object({
  name: z.string().min(2).max(80),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9_]+$/, "Username can only contain lowercase letters, numbers and underscores"),
  email: z.string().email(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .refine(
      (p) => /[A-Z]/.test(p) || /[0-9]/.test(p) || /[^A-Za-z0-9]/.test(p),
      "Password must contain at least one uppercase letter, number, or symbol",
    ),
});

export async function GET() {
  await connectDB();
  const count = await User.countDocuments({ betaUser: true });
  return NextResponse.json({ count, limit: BETA_LIMIT, spotsLeft: Math.max(0, BETA_LIMIT - count) });
}

export async function POST(req: NextRequest) {
  const limited = await enforceRateLimit("auth", req);
  if (limited) return limited;

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = betaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const { name, username, email, password } = parsed.data;
  const cleanName = sanitizeUserContent(cap(name, 80));
  const cleanUsername = cap(username.toLowerCase(), 30);
  const cleanEmail = email.toLowerCase();

  await connectDB();

  const betaCount = await User.countDocuments({ betaUser: true });
  if (betaCount >= BETA_LIMIT) {
    return NextResponse.json({ error: "Sorry, all 50 beta spots have been claimed." }, { status: 409 });
  }

  const [emailTaken, usernameTaken] = await Promise.all([
    User.exists({ email: cleanEmail }),
    User.exists({ username: cleanUsername }),
  ]);

  if (emailTaken) return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
  if (usernameTaken) return NextResponse.json({ error: "This username is already taken" }, { status: 409 });

  const planExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const hashed = await bcrypt.hash(password, 12);

  await User.create({
    name: cleanName,
    username: cleanUsername,
    email: cleanEmail,
    password: hashed,
    providers: ["credentials"],
    plan: "go",
    planExpiresAt,
    betaUser: true,
  });

  const spotsLeft = Math.max(0, BETA_LIMIT - betaCount - 1);
  const appUrl = process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const expiryStr = planExpiresAt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  sendEmail({
    to: cleanEmail,
    subject: betaWelcomeEmailSubject(cleanName),
    html: betaWelcomeEmailHtml({ name: cleanName, dashboardUrl: `${appUrl}/dashboard`, spotsLeft, planExpiresAt: expiryStr }),
  }).catch(() => {});

  return NextResponse.json({ ok: true, spotsLeft }, { status: 201 });
}
