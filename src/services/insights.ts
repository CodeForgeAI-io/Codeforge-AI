import { getGoogleAccessToken, hasGoogleServiceAccount } from "@/lib/google-auth";

/**
 * External-analytics dashboards for admins: PostHog (product analytics, realtime),
 * Google Analytics 4 (realtime users) and Google Search Console (search
 * performance). Every source degrades gracefully to `configured: false` when its
 * credentials are absent, and never throws.
 */

// ── PostHog ────────────────────────────────────────────────────────────────

export interface PostHogInsights {
  configured: boolean;
  error?: string;
  activeNow: number; // last 30 min
  users24h: number;
  pageviews24h: number;
  pageviews7d: number;
  topPages: { path: string; views: number }[];
  topEvents: { event: string; count: number }[];
}

const emptyPostHog: PostHogInsights = {
  configured: false,
  activeNow: 0,
  users24h: 0,
  pageviews24h: 0,
  pageviews7d: 0,
  topPages: [],
  topEvents: [],
};

function posthogApiHost(): string {
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";
  // Ingestion host (us.i.posthog.com) → API host (us.posthog.com).
  return host.replace("i.posthog.com", "posthog.com");
}

let cachedProjectId: string | null = null;
async function posthogProjectId(apiHost: string, key: string): Promise<string | null> {
  if (process.env.POSTHOG_PROJECT_ID) return process.env.POSTHOG_PROJECT_ID;
  if (cachedProjectId) return cachedProjectId;
  const res = await fetch(`${apiHost}/api/projects/`, { headers: { Authorization: `Bearer ${key}` } });
  if (!res.ok) return null;
  const data = (await res.json()) as { results?: { id: number; api_token: string }[] };
  const projects = data.results ?? [];
  const match = projects.find((p) => p.api_token === process.env.NEXT_PUBLIC_POSTHOG_KEY) ?? projects[0];
  cachedProjectId = match ? String(match.id) : null;
  return cachedProjectId;
}

async function hogql(apiHost: string, key: string, pid: string, sql: string): Promise<unknown[][]> {
  const res = await fetch(`${apiHost}/api/projects/${pid}/query/`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: { kind: "HogQLQuery", query: sql } }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`PostHog ${res.status}`);
  const data = (await res.json()) as { results?: unknown[][] };
  return data.results ?? [];
}

export async function getPostHogInsights(): Promise<PostHogInsights> {
  const key = process.env.POSTHOG_PERSONAL_API_KEY;
  if (!key) return emptyPostHog;
  const apiHost = posthogApiHost();
  try {
    const pid = await posthogProjectId(apiHost, key);
    if (!pid) return { ...emptyPostHog, configured: true, error: "No PostHog project found" };
    const [a, u, pv, pv7, tp, te] = await Promise.all([
      hogql(apiHost, key, pid, "SELECT count(DISTINCT distinct_id) FROM events WHERE timestamp > now() - INTERVAL 30 MINUTE"),
      hogql(apiHost, key, pid, "SELECT count(DISTINCT distinct_id) FROM events WHERE timestamp > now() - INTERVAL 24 HOUR"),
      hogql(apiHost, key, pid, "SELECT count() FROM events WHERE event = '$pageview' AND timestamp > now() - INTERVAL 24 HOUR"),
      hogql(apiHost, key, pid, "SELECT count() FROM events WHERE event = '$pageview' AND timestamp > now() - INTERVAL 7 DAY"),
      hogql(apiHost, key, pid, "SELECT properties.$pathname AS path, count() AS c FROM events WHERE event = '$pageview' AND timestamp > now() - INTERVAL 24 HOUR GROUP BY path ORDER BY c DESC LIMIT 8"),
      hogql(apiHost, key, pid, "SELECT event, count() AS c FROM events WHERE timestamp > now() - INTERVAL 24 HOUR GROUP BY event ORDER BY c DESC LIMIT 8"),
    ]);
    const n = (v: unknown) => Number(v ?? 0) || 0;
    return {
      configured: true,
      activeNow: n(a[0]?.[0]),
      users24h: n(u[0]?.[0]),
      pageviews24h: n(pv[0]?.[0]),
      pageviews7d: n(pv7[0]?.[0]),
      topPages: tp.map((r) => ({ path: String(r[0] ?? "/"), views: n(r[1]) })),
      topEvents: te.map((r) => ({ event: String(r[0] ?? ""), count: n(r[1]) })),
    };
  } catch (e) {
    return { ...emptyPostHog, configured: true, error: e instanceof Error ? e.message : "PostHog error" };
  }
}

// ── Google Analytics 4 (realtime) ────────────────────────────────────────────

export interface Ga4Insights {
  configured: boolean;
  error?: string;
  activeUsers: number; // realtime, last 30 min
  topPages: { path: string; users: number }[];
  topCountries: { country: string; users: number }[];
}

const emptyGa4: Ga4Insights = { configured: false, activeUsers: 0, topPages: [], topCountries: [] };

async function ga4Realtime(propertyId: string, token: string, body: unknown): Promise<{ rows?: { dimensionValues?: { value: string }[]; metricValues?: { value: string }[] }[] }> {
  const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runRealtimeReport`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`GA4 ${res.status}`);
  return res.json();
}

export async function getGa4Insights(): Promise<Ga4Insights> {
  const propertyId = process.env.GA4_PROPERTY_ID;
  if (!propertyId || !hasGoogleServiceAccount()) return emptyGa4;
  const token = await getGoogleAccessToken(["https://www.googleapis.com/auth/analytics.readonly"]);
  if (!token) return { ...emptyGa4, configured: true, error: "Google auth failed" };
  try {
    const [total, pages, countries] = await Promise.all([
      ga4Realtime(propertyId, token, { metrics: [{ name: "activeUsers" }] }),
      ga4Realtime(propertyId, token, { dimensions: [{ name: "unifiedScreenName" }], metrics: [{ name: "activeUsers" }], limit: 8 }),
      ga4Realtime(propertyId, token, { dimensions: [{ name: "country" }], metrics: [{ name: "activeUsers" }], limit: 6 }),
    ]);
    return {
      configured: true,
      activeUsers: Number(total.rows?.[0]?.metricValues?.[0]?.value ?? 0),
      topPages: (pages.rows ?? []).map((r) => ({ path: r.dimensionValues?.[0]?.value ?? "", users: Number(r.metricValues?.[0]?.value ?? 0) })),
      topCountries: (countries.rows ?? []).map((r) => ({ country: r.dimensionValues?.[0]?.value ?? "", users: Number(r.metricValues?.[0]?.value ?? 0) })),
    };
  } catch (e) {
    return { ...emptyGa4, configured: true, error: e instanceof Error ? e.message : "GA4 error" };
  }
}

// ── Google Search Console ────────────────────────────────────────────────────

export interface GscInsights {
  configured: boolean;
  error?: string;
  clicks: number;
  impressions: number;
  ctr: number; // %
  position: number;
  topQueries: { query: string; clicks: number; impressions: number }[];
  topPages: { page: string; clicks: number; impressions: number }[];
}

const emptyGsc: GscInsights = { configured: false, clicks: 0, impressions: 0, ctr: 0, position: 0, topQueries: [], topPages: [] };

interface GscRow { keys?: string[]; clicks?: number; impressions?: number; ctr?: number; position?: number }

export async function getSearchConsoleInsights(): Promise<GscInsights> {
  // e.g. "sc-domain:codeforgeai.io" or "https://codeforgeai.io/"
  const site = process.env.GSC_SITE_URL;
  if (!site || !hasGoogleServiceAccount()) return emptyGsc;
  const token = await getGoogleAccessToken(["https://www.googleapis.com/auth/webmasters.readonly"]);
  if (!token) return { ...emptyGsc, configured: true, error: "Google auth failed" };

  const iso = (d: Date) => d.toISOString().slice(0, 10);
  // GSC data lags ~2 days; query the last 28 complete days.
  const end = iso(new Date(Date.now() - 2 * 86_400_000));
  const start = iso(new Date(Date.now() - 30 * 86_400_000));
  const url = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/searchAnalytics/query`;
  const query = async (body: unknown): Promise<GscRow[]> => {
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(9000),
    });
    if (!res.ok) throw new Error(`GSC ${res.status}`);
    const data = (await res.json()) as { rows?: GscRow[] };
    return data.rows ?? [];
  };

  try {
    const [totals, queries, pages] = await Promise.all([
      query({ startDate: start, endDate: end }),
      query({ startDate: start, endDate: end, dimensions: ["query"], rowLimit: 10 }),
      query({ startDate: start, endDate: end, dimensions: ["page"], rowLimit: 10 }),
    ]);
    const t = totals[0] ?? {};
    return {
      configured: true,
      clicks: t.clicks ?? 0,
      impressions: t.impressions ?? 0,
      ctr: Math.round((t.ctr ?? 0) * 1000) / 10,
      position: Math.round((t.position ?? 0) * 10) / 10,
      topQueries: queries.map((r) => ({ query: r.keys?.[0] ?? "", clicks: r.clicks ?? 0, impressions: r.impressions ?? 0 })),
      topPages: pages.map((r) => ({ page: r.keys?.[0] ?? "", clicks: r.clicks ?? 0, impressions: r.impressions ?? 0 })),
    };
  } catch (e) {
    return { ...emptyGsc, configured: true, error: e instanceof Error ? e.message : "GSC error" };
  }
}
