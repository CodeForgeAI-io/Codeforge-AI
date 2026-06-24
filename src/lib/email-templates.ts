// CodeForge AI email templates — clean SaaS look, light theme, brand accent.
const BRAND = "#006bff";
const PAGE = "#f4f6f9";
const CARD = "#ffffff";
const SOFT = "#f6f8fb";
const BORDER = "#e6e9ef";
const TEXT = "#0b1220";
const MUTED = "#6b7280";
const LOGO = "https://codeforgeai.io/logo.png";

function base(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>CodeForge AI</title>
</head>
<body style="margin:0;padding:0;background:${PAGE};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAGE};padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:28px;">
              <img src="${LOGO}" alt="CodeForge AI" height="30" style="height:30px;width:auto;display:block;" />
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:${CARD};border:1px solid ${BORDER};border-radius:18px;padding:42px 38px;box-shadow:0 6px 24px rgba(17,24,39,0.05);">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:26px;">
              <p style="margin:0 0 10px;font-size:12px;color:${MUTED};line-height:1.7;">
                You received this email because you have an account on CodeForge AI.<br/>
                If you didn't request this, you can safely ignore it.
              </p>
              <p style="margin:0;font-size:12px;color:#9aa1ad;">
                <a href="https://codeforgeai.io" style="color:${BRAND};text-decoration:none;font-weight:600;">codeforgeai.io</a>
                &nbsp;&middot;&nbsp; &copy; ${new Date().getFullYear()} CodeForge AI
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
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:30px auto 0;">
    <tr>
      <td align="center" style="background:${BRAND};border-radius:10px;">
        <a href="${href}" target="_blank"
           style="display:inline-block;padding:14px 34px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;letter-spacing:0.2px;border-radius:10px;background:${BRAND};">
          ${label}
        </a>
      </td>
    </tr>
  </table>`;
}

function divider(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:30px 0;">
    <tr><td style="border-top:1px solid ${BORDER};"></td></tr>
  </table>`;
}

/** Feature line with a small brand dot — no icons/emoji. */
function featureRow(text: string, last = false): string {
  return `<tr>
    <td style="padding:${last ? "0" : "0 0 13px"};">
      <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${BRAND};vertical-align:middle;"></span>
      <span style="color:${TEXT};font-size:14px;font-weight:500;margin-left:12px;vertical-align:middle;">${text}</span>
    </td>
  </tr>`;
}

function eyebrow(label: string): string {
  return `<div style="margin-bottom:16px;">
    <span style="display:inline-block;background:${BRAND}14;border:1px solid ${BRAND}33;color:${BRAND};font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;padding:6px 14px;border-radius:100px;">
      ${label}
    </span>
  </div>`;
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
    <h1 style="margin:0 0 10px;color:${TEXT};font-size:24px;font-weight:600;letter-spacing:-0.6px;">
      Welcome to CodeForge AI, ${name}
    </h1>
    <p style="margin:0 0 26px;color:${MUTED};font-size:15px;line-height:1.7;">
      Your account is ready. You're now part of a community of developers
      sharpening their skills and acing technical interviews.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="background:${SOFT};border:1px solid ${BORDER};border-radius:12px;padding:24px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${featureRow("Solve 500+ real interview problems")}
            ${featureRow("AI mentor, pair programmer and 9 AI tools")}
            ${featureRow("Weekly contests and global leaderboards")}
            ${featureRow("Progress tracking, streaks and analytics", true)}
          </table>
        </td>
      </tr>
    </table>

    ${btn("Go to dashboard", loginUrl)}

    ${divider()}

    <p style="margin:0;color:${MUTED};font-size:13px;line-height:1.6;text-align:center;">
      Questions? Just reply to this email and we'll be happy to help.
    </p>
  `);
}

export function welcomeEmailSubject(name: string): string {
  return `Welcome to CodeForge AI, ${name}`;
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
    ${eyebrow("Beta access granted")}

    <h1 style="margin:0 0 10px;color:${TEXT};font-size:24px;font-weight:600;letter-spacing:-0.6px;">
      You're in, ${name}
    </h1>
    <p style="margin:0 0 26px;color:${MUTED};font-size:15px;line-height:1.7;">
      You've secured early access to CodeForge AI. As a beta member you get the
      <strong style="color:${TEXT};">Go Plan free for 30 days</strong> — no credit card needed.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:22px;">
      <tr>
        <td style="background:${BRAND}0d;border:1px solid ${BRAND}26;border-radius:14px;padding:24px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${featureRow("Go Plan — free for 30 days")}
            ${featureRow(`Plan active until <strong style="color:${TEXT};">${planExpiresAt}</strong>`)}
            ${featureRow("Unlimited AI Mentor, Pair Programmer and Coach")}
            ${featureRow("All contests, challenges and leaderboards")}
            ${featureRow("Spaced repetition and advanced analytics", true)}
          </table>
        </td>
      </tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:26px;">
      <tr>
        <td style="background:${SOFT};border:1px solid ${BORDER};border-radius:12px;padding:16px 20px;text-align:center;">
          <span style="color:${MUTED};font-size:13px;">Only <strong style="color:${BRAND};">${spotsLeft} beta spot${spotsLeft !== 1 ? "s" : ""} remaining</strong> — share with friends before they're gone.</span>
        </td>
      </tr>
    </table>

    ${btn("Start solving problems", dashboardUrl)}

    ${divider()}

    <p style="margin:0;color:${MUTED};font-size:13px;line-height:1.6;text-align:center;">
      Questions or feedback? Reply to this email — we read every message.
    </p>
  `);
}

export function betaWelcomeEmailSubject(name: string): string {
  return `You're in, ${name} — beta access and Go Plan activated`;
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
    <h1 style="margin:0 0 10px;color:${TEXT};font-size:22px;font-weight:600;letter-spacing:-0.5px;">
      Reset your password
    </h1>
    <p style="margin:0 0 8px;color:${MUTED};font-size:15px;line-height:1.7;">
      Hi ${name}, we received a request to reset your CodeForge AI password.
      Click the button below to choose a new one.
    </p>

    ${btn("Reset password", resetUrl)}

    ${divider()}

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="background:${SOFT};border:1px solid ${BORDER};border-radius:10px;padding:14px 18px;">
          <p style="margin:0;color:${MUTED};font-size:13px;line-height:1.6;">
            This link expires in <strong style="color:${TEXT};">${expiryMinutes} minutes</strong>.
            If you didn't request a password reset, you can safely ignore this email —
            your password won't be changed.
          </p>
        </td>
      </tr>
    </table>

    <p style="margin:22px 0 0;color:${MUTED};font-size:12px;line-height:1.7;word-break:break-all;">
      Or copy and paste this link into your browser:<br/>
      <a href="${resetUrl}" style="color:${BRAND};">${resetUrl}</a>
    </p>
  `);
}

export const resetPasswordEmailSubject = "Reset your CodeForge AI password";
