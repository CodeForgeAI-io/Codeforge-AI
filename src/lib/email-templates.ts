// CodeForge AI email templates — Vercel Geist design system (Light theme).
// Primary action = solid gray-1000; blue-700 reserved for links/accent.
const PRIMARY = "#171717"; // gray-1000 — primary text + primary button
const SECONDARY = "#4d4d4d"; // gray-900 — secondary text
const MUTED = "#8f8f8f"; // gray-700 — tertiary text / fine print
const BLUE = "#006bff"; // blue-700 — links, accent
const BLUE_100 = "#f0f7ff"; // blue-100 — info surface
const BLUE_400 = "#cae7ff"; // blue-400 — info border
const BG100 = "#ffffff"; // card surface
const PAGE = "#f2f2f2"; // gray-100 — page background
const SOFT = "#fafafa"; // background-200 — subtle separation
const BORDER = "#00000014"; // gray-alpha-400 — default border
const SHADOW = "0 2px 2px rgba(0,0,0,0.04)"; // raised card
const FONT =
  "'Geist','Geist Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
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
<body style="margin:0;padding:0;background:${PAGE};font-family:${FONT};-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAGE};padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="540" cellpadding="0" cellspacing="0" style="max-width:540px;width:100%;">
          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <img src="${LOGO}" alt="CodeForge AI" height="28" style="height:28px;width:auto;display:block;" />
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:${BG100};border:1px solid ${BORDER};border-radius:16px;padding:40px;box-shadow:${SHADOW};">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0 0 8px;font-size:13px;color:${MUTED};line-height:18px;">
                You received this email because you have an account on CodeForge AI.<br/>
                If you didn't request this, you can safely ignore it.
              </p>
              <p style="margin:0;font-size:13px;color:${MUTED};">
                <a href="https://codeforgeai.io" style="color:${BLUE};text-decoration:none;">codeforgeai.io</a>
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

/** Geist primary button — solid gray-1000, white label, 6px radius. */
function btn(label: string, href: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px auto 0;">
    <tr>
      <td align="center" style="background:${PRIMARY};border-radius:6px;">
        <a href="${href}" target="_blank"
           style="display:inline-block;padding:14px 24px;color:${BG100};font-size:16px;font-weight:500;line-height:20px;text-decoration:none;border-radius:6px;background:${PRIMARY};">
          ${label}
        </a>
      </td>
    </tr>
  </table>`;
}

function divider(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
    <tr><td style="border-top:1px solid ${BORDER};"></td></tr>
  </table>`;
}

/** Feature line with a small blue accent dot. */
function featureRow(text: string, last = false): string {
  return `<tr>
    <td style="padding:${last ? "0" : "0 0 14px"};">
      <span style="display:inline-block;width:6px;height:6px;border-radius:9999px;background:${BLUE};vertical-align:middle;"></span>
      <span style="color:${PRIMARY};font-size:14px;font-weight:400;line-height:20px;margin-left:12px;vertical-align:middle;">${text}</span>
    </td>
  </tr>`;
}

function eyebrow(label: string): string {
  return `<div style="margin-bottom:16px;">
    <span style="display:inline-block;background:${BLUE_100};border:1px solid ${BLUE_400};color:${BLUE};font-size:12px;font-weight:600;letter-spacing:0.4px;text-transform:uppercase;padding:5px 12px;border-radius:9999px;">
      ${label}
    </span>
  </div>`;
}

const H1 =
  `margin:0 0 10px;color:${PRIMARY};font-size:24px;font-weight:600;line-height:32px;letter-spacing:-0.96px;`;
const COPY = `margin:0 0 24px;color:${SECONDARY};font-size:16px;line-height:24px;`;

// ─── Welcome / Account Created ────────────────────────────────────────────────

export function welcomeEmailHtml({
  name,
  loginUrl,
}: {
  name: string;
  loginUrl: string;
}): string {
  return base(`
    <h1 style="${H1}">Welcome to CodeForge AI, ${name}</h1>
    <p style="${COPY}">
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

    ${btn("Go to Dashboard", loginUrl)}

    ${divider()}

    <p style="margin:0;color:${MUTED};font-size:13px;line-height:18px;text-align:center;">
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

    <h1 style="${H1}">You're in, ${name}</h1>
    <p style="${COPY}">
      You've secured early access to CodeForge AI. As a beta member you get the
      <strong style="color:${PRIMARY};font-weight:600;">Go Plan free for 30 days</strong> — no credit card needed.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      <tr>
        <td style="background:${SOFT};border:1px solid ${BORDER};border-radius:12px;padding:24px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${featureRow("Go Plan — free for 30 days")}
            ${featureRow(`Plan active until <strong style="color:${PRIMARY};font-weight:600;">${planExpiresAt}</strong>`)}
            ${featureRow("Unlimited AI Mentor, Pair Programmer and Coach")}
            ${featureRow("All contests, challenges and leaderboards")}
            ${featureRow("Spaced repetition and advanced analytics", true)}
          </table>
        </td>
      </tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="background:${BLUE_100};border:1px solid ${BLUE_400};border-radius:12px;padding:14px 18px;text-align:center;">
          <span style="color:${SECONDARY};font-size:13px;line-height:18px;">Only <strong style="color:${BLUE};font-weight:600;">${spotsLeft} beta spot${spotsLeft !== 1 ? "s" : ""} remaining</strong> — share with friends before they're gone.</span>
        </td>
      </tr>
    </table>

    ${btn("Start Solving Problems", dashboardUrl)}

    ${divider()}

    <p style="margin:0;color:${MUTED};font-size:13px;line-height:18px;text-align:center;">
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
    <h1 style="${H1}">Reset your password</h1>
    <p style="margin:0;color:${SECONDARY};font-size:16px;line-height:24px;">
      Hi ${name}, we received a request to reset your CodeForge AI password.
      Click the button below to choose a new one.
    </p>

    ${btn("Reset Password", resetUrl)}

    ${divider()}

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="background:${SOFT};border:1px solid ${BORDER};border-radius:12px;padding:14px 18px;">
          <p style="margin:0;color:${SECONDARY};font-size:13px;line-height:18px;">
            This link expires in <strong style="color:${PRIMARY};font-weight:600;">${expiryMinutes} minutes</strong>.
            If you didn't request a password reset, you can safely ignore this email —
            your password won't be changed.
          </p>
        </td>
      </tr>
    </table>

    <p style="margin:20px 0 0;color:${MUTED};font-size:13px;line-height:18px;word-break:break-all;">
      Or copy and paste this link into your browser:<br/>
      <a href="${resetUrl}" style="color:${BLUE};">${resetUrl}</a>
    </p>
  `);
}

export const resetPasswordEmailSubject = "Reset your CodeForge AI password";
