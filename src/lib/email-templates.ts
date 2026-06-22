const BRAND = "#006bff"; // Geist blue-700
const BRAND_DARK = "#ea6c09";
const BG = "#0f0f0f";
const CARD = "#1a1a1a";
const BORDER = "#2a2a2a";
const TEXT = "#e5e5e5";
const MUTED = "#a3a3a3";

function base(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>CodeForge AI</title>
</head>
<body style="margin:0;padding:0;background:${BG};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${BG};min-height:100vh;padding:40px 16px;">
    <tr>
      <td align="center">
        <!-- Logo -->
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:${BRAND};border-radius:10px;padding:10px 14px;display:inline-block;">
                    <span style="color:#fff;font-size:18px;font-weight:800;letter-spacing:-0.5px;">⚡ CodeForge AI</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:${CARD};border:1px solid ${BORDER};border-radius:16px;padding:40px 36px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:28px;">
              <p style="margin:0;font-size:12px;color:${MUTED};line-height:1.6;">
                You received this email because you have an account on CodeForge AI.<br/>
                If you didn't request this, you can safely ignore it.<br/><br/>
                &copy; ${new Date().getFullYear()} CodeForge AI &middot; All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function btn(label: string, href: string): string {
  return `<table cellpadding="0" cellspacing="0" style="margin:28px auto 0;">
    <tr>
      <td align="center" style="background:${BRAND};border-radius:8px;">
        <a href="${href}"
           style="display:inline-block;padding:14px 32px;color:#fff;font-size:15px;font-weight:700;text-decoration:none;letter-spacing:0.2px;border-radius:8px;background:${BRAND};"
           target="_blank">${label}</a>
      </td>
    </tr>
  </table>`;
}

function divider(): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
    <tr><td style="border-top:1px solid ${BORDER};"></td></tr>
  </table>`;
}

// ─── Welcome / Account Created ────────────────────────────────────────────────

export function welcomeEmailHtml({
  name,
  loginUrl,
}: {
  name: string;
  loginUrl: string;
}): string {
  return base(`
    <h1 style="margin:0 0 8px;color:${TEXT};font-size:24px;font-weight:800;letter-spacing:-0.5px;">
      Welcome to CodeForge AI, ${name}! 🎉
    </h1>
    <p style="margin:0 0 24px;color:${MUTED};font-size:15px;line-height:1.7;">
      Your account is ready. You're now part of a community of developers
      sharpening their skills and crushing interviews.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="background:#111;border:1px solid ${BORDER};border-radius:10px;padding:20px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-bottom:12px;">
                <span style="font-size:20px;">🚀</span>
                <span style="color:${TEXT};font-size:14px;font-weight:600;margin-left:8px;">Start solving problems</span>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:12px;">
                <span style="font-size:20px;">🤖</span>
                <span style="color:${TEXT};font-size:14px;font-weight:600;margin-left:8px;">AI-powered explanations &amp; feedback</span>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:12px;">
                <span style="font-size:20px;">🏆</span>
                <span style="color:${TEXT};font-size:14px;font-weight:600;margin-left:8px;">Compete in weekly contests</span>
              </td>
            </tr>
            <tr>
              <td>
                <span style="font-size:20px;">📊</span>
                <span style="color:${TEXT};font-size:14px;font-weight:600;margin-left:8px;">Track your progress &amp; streaks</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    ${btn("Go to Dashboard →", loginUrl)}

    ${divider()}

    <p style="margin:0;color:${MUTED};font-size:13px;line-height:1.6;text-align:center;">
      Questions? Reply to this email and we'll be happy to help.
    </p>
  `);
}

export function welcomeEmailSubject(name: string): string {
  return `Welcome to CodeForge AI, ${name}! 🎉`;
}

// ─── Beta Welcome ─────────────────────────────────────────────────────────────

export function betaWelcomeEmailHtml({
  name,
  dashboardUrl,
  spotsLeft,
  planExpiresAt,
}: {
  name: string;
  dashboardUrl: string;
  spotsLeft: number;
  planExpiresAt: string;
}): string {
  return base(`
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-block;background:rgba(168,85,247,0.15);border:1px solid rgba(168,85,247,0.3);border-radius:50%;padding:18px;">
        <span style="font-size:36px;line-height:1;">🚀</span>
      </div>
    </div>

    <div style="text-align:center;margin-bottom:20px;">
      <span style="display:inline-block;background:rgba(168,85,247,0.12);border:1px solid rgba(168,85,247,0.3);color:#a855f7;font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;padding:4px 14px;border-radius:100px;">
        Beta Access Granted
      </span>
    </div>

    <h1 style="margin:0 0 8px;color:${TEXT};font-size:24px;font-weight:800;letter-spacing:-0.5px;text-align:center;">
      You're in, ${name}! 🎉
    </h1>
    <p style="margin:0 0 28px;color:${MUTED};font-size:15px;line-height:1.7;text-align:center;">
      You've secured early access to CodeForge AI. As a beta member,
      you get the <strong style="color:${TEXT};">Go Plan free for 30 days</strong> — no credit card needed.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="background:rgba(249,115,22,0.08);border:1px solid rgba(249,115,22,0.2);border-radius:12px;padding:20px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-bottom:14px;">
                <span style="font-size:18px;">⚡</span>
                <span style="color:${TEXT};font-size:14px;font-weight:700;margin-left:10px;">Go Plan — Free for 30 days</span>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:14px;">
                <span style="font-size:18px;">📅</span>
                <span style="color:${MUTED};font-size:14px;margin-left:10px;">Plan active until <strong style="color:${TEXT};">${planExpiresAt}</strong></span>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:14px;">
                <span style="font-size:18px;">🤖</span>
                <span style="color:${TEXT};font-size:14px;font-weight:600;margin-left:10px;">Unlimited AI Mentor, Pair Programmer &amp; Coach</span>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:14px;">
                <span style="font-size:18px;">🏆</span>
                <span style="color:${TEXT};font-size:14px;font-weight:600;margin-left:10px;">All contests, challenges &amp; leaderboards</span>
              </td>
            </tr>
            <tr>
              <td>
                <span style="font-size:18px;">🔁</span>
                <span style="color:${TEXT};font-size:14px;font-weight:600;margin-left:10px;">Spaced repetition &amp; advanced analytics</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td style="background:#111;border:1px solid ${BORDER};border-radius:10px;padding:16px 20px;text-align:center;">
          <span style="color:${MUTED};font-size:13px;">Only <strong style="color:${BRAND};">${spotsLeft} beta spot${spotsLeft !== 1 ? "s" : ""} remaining</strong> — share with friends before it's gone!</span>
        </td>
      </tr>
    </table>

    ${btn("Start Solving Problems →", dashboardUrl)}

    ${divider()}

    <p style="margin:0;color:${MUTED};font-size:13px;line-height:1.6;text-align:center;">
      Questions or feedback? Reply to this email — we read every message.<br/>
      Thank you for being an early adopter! 💙
    </p>
  `);
}

export function betaWelcomeEmailSubject(name: string): string {
  return `🚀 You're in, ${name}! Beta access + Go Plan activated`;
}

// ─── Password Reset ───────────────────────────────────────────────────────────

export function resetPasswordEmailHtml({
  name,
  resetUrl,
  expiryMinutes = 60,
}: {
  name: string;
  resetUrl: string;
  expiryMinutes?: number;
}): string {
  return base(`
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-block;background:#292214;border:1px solid #6b3a14;border-radius:50%;padding:16px;">
        <span style="font-size:32px;line-height:1;">🔑</span>
      </div>
    </div>

    <h1 style="margin:0 0 8px;color:${TEXT};font-size:22px;font-weight:800;letter-spacing:-0.5px;text-align:center;">
      Reset your password
    </h1>
    <p style="margin:0 0 24px;color:${MUTED};font-size:15px;line-height:1.7;text-align:center;">
      Hi ${name}, we received a request to reset your CodeForge AI password.
      Click the button below to choose a new one.
    </p>

    ${btn("Reset Password", resetUrl)}

    ${divider()}

    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="background:#1c1407;border:1px solid #6b3a14;border-radius:8px;padding:14px 18px;">
          <p style="margin:0;color:#fbbf24;font-size:13px;line-height:1.6;">
            ⏱ This link expires in <strong>${expiryMinutes} minutes</strong>.
            If you didn't request a password reset, you can safely ignore this email —
            your password will not be changed.
          </p>
        </td>
      </tr>
    </table>

    <p style="margin:24px 0 0;color:${MUTED};font-size:12px;line-height:1.7;word-break:break-all;">
      Or copy and paste this link into your browser:<br/>
      <a href="${resetUrl}" style="color:${BRAND_DARK};">${resetUrl}</a>
    </p>
  `);
}

export const resetPasswordEmailSubject =
  "Reset your CodeForge AI password 🔑";
