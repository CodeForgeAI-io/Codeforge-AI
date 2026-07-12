/**
 * Server-side reCAPTCHA v3 verification.
 *
 * Degrades gracefully so it can never take the site down:
 * - No `RECAPTCHA_SECRET_KEY` configured → skip (returns ok). Envs without the
 *   key keep working.
 * - Google unreachable / network error → fail open (returns ok). A Google
 *   outage must not block real sign-ups.
 * - Missing token or a low score → block (this is the actual protection).
 */

const VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

export interface RecaptchaResult {
  ok: boolean;
  score?: number;
  reason?: string;
}

interface SiteVerifyResponse {
  success?: boolean;
  score?: number;
  action?: string;
  "error-codes"?: string[];
}

/**
 * Verify a reCAPTCHA token.
 * @param token - The token from the client (`getRecaptchaToken`).
 * @param opts.action - Expected v3 action; mismatches are rejected.
 * @param opts.minScore - Minimum v3 score to accept (default 0.5).
 */
export async function verifyRecaptcha(
  token: string | undefined | null,
  opts?: { action?: string; minScore?: number },
): Promise<RecaptchaResult> {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) return { ok: true, reason: "not-configured" };
  if (!token) return { ok: false, reason: "missing-token" };

  let data: SiteVerifyResponse;
  try {
    const res = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
    });
    data = (await res.json()) as SiteVerifyResponse;
  } catch {
    // Fail open — never block a real user because Google is unreachable.
    return { ok: true, reason: "verify-unreachable" };
  }

  if (!data.success) {
    return { ok: false, reason: (data["error-codes"] ?? []).join(",") || "verification-failed" };
  }
  // v3 responses carry a score/action; v2 responses don't (success is enough).
  if (typeof data.score === "number" && data.score < (opts?.minScore ?? 0.5)) {
    return { ok: false, score: data.score, reason: "low-score" };
  }
  if (opts?.action && data.action && data.action !== opts.action) {
    return { ok: false, reason: "action-mismatch" };
  }
  return { ok: true, score: data.score };
}
