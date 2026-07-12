import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models";
import { registerSchema } from "@/schemas/auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/mailer";
import { welcomeEmailHtml, welcomeEmailSubject } from "@/lib/email-templates";
import { verifyRecaptcha } from "@/lib/recaptcha";

export async function POST(req: NextRequest) {
  const limited = await enforceRateLimit("auth", req);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Bot check (reCAPTCHA v3). No-ops when reCAPTCHA isn't configured.
  const token = body && typeof body === "object" ? (body as Record<string, unknown>).recaptchaToken : undefined;
  const rc = await verifyRecaptcha(typeof token === "string" ? token : undefined, { action: "register" });
  if (!rc.ok) {
    return NextResponse.json(
      { error: "Couldn't verify you're human. Please refresh and try again." },
      { status: 400 },
    );
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { name, username, email, password } = parsed.data;

  await connectDB();

  const [emailTaken, usernameTaken] = await Promise.all([
    User.exists({ email: email.toLowerCase() }),
    User.exists({ username: username.toLowerCase() }),
  ]);

  if (emailTaken) {
    return NextResponse.json(
      { error: "An account with this email already exists" },
      { status: 409 },
    );
  }
  if (usernameTaken) {
    return NextResponse.json(
      { error: "This username is already taken" },
      { status: 409 },
    );
  }

  const admins = (process.env.ADMIN_EMAILS ?? process.env.ADMIN_EMAIL ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  const hashed = await bcrypt.hash(password, 12);
  await User.create({
    name,
    username: username.toLowerCase(),
    email: email.toLowerCase(),
    password: hashed,
    providers: ["credentials"],
    role: admins.includes(email.toLowerCase()) ? "admin" : "user",
  });

  // Send welcome email — fire-and-forget so registration is never blocked
  const appUrl =
    process.env.NEXTAUTH_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000";
  sendEmail({
    to: email.toLowerCase(),
    subject: welcomeEmailSubject(name),
    html: welcomeEmailHtml({ name, loginUrl: `${appUrl}/dashboard` }),
  }).catch(() => {});

  return NextResponse.json({ ok: true }, { status: 201 });
}
