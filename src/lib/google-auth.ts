import crypto from "crypto";

/**
 * Mint a Google API access token from a service-account JSON (no SDK).
 *
 * Set GOOGLE_SERVICE_ACCOUNT_JSON to the full service-account key JSON (one
 * line). The same account, granted access to both GA4 and Search Console, can
 * serve both dashboards. Tokens are cached in-process until shortly before they
 * expire.
 */

interface ServiceAccount {
  client_email: string;
  private_key: string;
}

function loadServiceAccount(): ServiceAccount | null {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  try {
    const j = JSON.parse(raw) as Partial<ServiceAccount>;
    if (j.client_email && j.private_key) {
      // Support both real newlines and the escaped \n form.
      return { client_email: j.client_email, private_key: j.private_key.replace(/\\n/g, "\n") };
    }
  } catch {
    // fall through
  }
  return null;
}

export function hasGoogleServiceAccount(): boolean {
  return loadServiceAccount() !== null;
}

const cache = new Map<string, { token: string; exp: number }>();

/** Get an OAuth access token for the given scopes, or null if not configured. */
export async function getGoogleAccessToken(scopes: string[]): Promise<string | null> {
  const sa = loadServiceAccount();
  if (!sa) return null;

  const scope = scopes.join(" ");
  const now = Math.floor(Date.now() / 1000);
  const hit = cache.get(scope);
  if (hit && hit.exp > now + 60) return hit.token;

  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const claims = Buffer.from(
    JSON.stringify({
      iss: sa.client_email,
      scope,
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  ).toString("base64url");

  const signer = crypto.createSign("RSA-SHA256");
  signer.update(`${header}.${claims}`);
  const signature = signer.sign(sa.private_key).toString("base64url");
  const jwt = `${header}.${claims}.${signature}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!data.access_token) return null;

  cache.set(scope, { token: data.access_token, exp: now + (data.expires_in ?? 3600) });
  return data.access_token;
}
