import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import { enforceRateLimit } from "@/lib/rate-limit";
import { JobApplication } from "@/models";
import { getCareer } from "@/content/careers";
import { sendEmail } from "@/lib/mailer";
import { APP_NAME } from "@/lib/constants";

export const runtime = "nodejs";

const schema = z.object({
  role: z.string().min(1),
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().max(30).optional().or(z.literal("")),
  link: z.string().url().max(300).optional().or(z.literal("")),
  message: z.string().min(20).max(4000),
});

export async function POST(req: NextRequest) {
  const limited = await enforceRateLimit("auth", req);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = issue?.path?.[0];
    const messages: Record<string, string> = {
      name: "Please enter your full name.",
      email: "Please enter a valid email address.",
      link: "Please enter a valid URL (or leave it blank).",
      message: "Tell us a bit about yourself — at least 20 characters.",
    };
    return NextResponse.json(
      { error: (field && messages[String(field)]) || issue?.message || "Invalid input" },
      { status: 400 },
    );
  }

  const role = getCareer(parsed.data.role);
  if (!role) return NextResponse.json({ error: "Unknown role" }, { status: 400 });

  const { name, email, phone, link, message } = parsed.data;

  try {
    await connectDB();
    await JobApplication.create({
      role: role.slug,
      roleTitle: role.title,
      name,
      email,
      phone: phone || "",
      link: link || "",
      message,
    });
  } catch (err) {
    console.error("[careers] save failed:", err);
    return NextResponse.json({ error: "Could not submit your application. Please try again." }, { status: 502 });
  }

  // Notify the team (best-effort).
  const esc = (s: string) => s.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  try {
    await sendEmail({
      to: process.env.CAREERS_EMAIL ?? process.env.FEEDBACK_EMAIL ?? process.env.SMTP_USER ?? "info@codeforgeai.io",
      subject: `[${APP_NAME} Careers] ${role.title} — ${name}`,
      html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#111827">
        <h2 style="color:#006bff">New application — ${esc(role.title)}</h2>
        <p><b>Name:</b> ${esc(name)}<br/><b>Email:</b> ${esc(email)}${phone ? `<br/><b>Phone:</b> ${esc(phone)}` : ""}${link ? `<br/><b>Link:</b> <a href="${esc(link)}">${esc(link)}</a>` : ""}</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0"/>
        <div style="white-space:pre-wrap;font-size:14px;line-height:1.6">${esc(message)}</div>
      </div>`,
    });
  } catch (err) {
    console.error("[careers] team email failed:", err);
  }

  // Confirmation to applicant (best-effort).
  try {
    await sendEmail({
      to: email,
      subject: `We received your application — ${APP_NAME}`,
      html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#111827">
        <h2 style="color:#006bff;margin:0 0 8px">Thanks for applying!</h2>
        <p style="font-size:14px;line-height:1.6;color:#374151">We received your application for <b>${esc(role.title)}</b> at ${APP_NAME}. Our team will review it and get back to you if it's a fit.</p>
        <p style="font-size:13px;color:#6b7280">— The ${APP_NAME} team · <a href="https://codeforgeai.io" style="color:#006bff;text-decoration:none">codeforgeai.io</a></p>
      </div>`,
    });
  } catch (err) {
    console.error("[careers] confirmation email failed:", err);
  }

  return NextResponse.json({ ok: true });
}
