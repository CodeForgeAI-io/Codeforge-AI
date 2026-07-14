/**
 * External-analytics dashboard for admins: PostHog product analytics (realtime).
 * Degrades to `configured: false` when its credentials are absent, and never
 * throws.
 */

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
