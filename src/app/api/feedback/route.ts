import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { z } from "zod";
import { sendEmail } from "@/lib/mailer";
import { serverLog, flushLogs } from "@/lib/otel-logger";
import { APP_NAME } from "@/lib/constants";

const feedbackSchema = z.object({
  type: z.enum(["feature", "bug", "issue"]),
  title: z.string().min(3).max(120),
  description: z.string().min(10).max(4000),
  email: z.string().email().optional().or(z.literal("")),
});

const TYPE_LABELS: Record<string, string> = {
  feature: "Feature Request",
  bug: "Bug Report",
  issue: "Issue / Other",
};

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = feedbackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { type, title, description, email } = parsed.data;
  const typeLabel = TYPE_LABELS[type] ?? type;
  const from = email ? `from ${email}` : "anonymous";

  serverLog("Feedback submitted", { type, hasEmail: Boolean(email) });
  after(async () => {
    await flushLogs();
  });

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
      <h2 style="color:#006bff;">[${typeLabel}] ${title}</h2>
      <p style="color:#6b7280;font-size:13px;">Submitted ${from} via ${APP_NAME} feedback form</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0"/>
      <div style="white-space:pre-wrap;font-size:14px;line-height:1.6;color:#111827;">${description.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
      ${email ? `<hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0"/><p style="font-size:13px;color:#6b7280;">Reply to: <a href="mailto:${email}">${email}</a></p>` : ""}
    </div>
  `;

  // Deliver the feedback via email.
  try {
    await sendEmail({
      to: process.env.FEEDBACK_EMAIL ?? process.env.SMTP_USER ?? "info@setups.works",
      subject: `[${APP_NAME} Feedback] [${typeLabel}] ${title}`,
      html,
    });
  } catch (err) {
    console.error("[feedback] Email notification failed:", err);
    return NextResponse.json(
      { error: "Could not submit feedback. Please try again later." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
