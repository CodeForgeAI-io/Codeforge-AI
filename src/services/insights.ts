/**
 * PostHog product-analytics dashboard for admins (realtime + last-7-day
 * breakdowns via the HogQL query API). Degrades to `configured: false` when the
 * personal API key is absent, and never throws.
 */

export interface NameCount {
  name: string;
  count: number;
}

export interface PostHogInsights {
  configured: boolean;
  error?: string;
  // headline stats
  activeNow: number; // last 30 min
  uniques24h: number;
  sessions24h: number;
  avgSessionSec: number;
  pageviews24h: number;
  pageviews7d: number;
  errors24h: number;
  // breakdowns
  trend: { date: string; views: number }[]; // last 14 days
  topPages: { path: string; views: number }[];
  topEvents: NameCount[];
  referrers: NameCount[];
  countries: NameCount[];
  browsers: NameCount[];
  devices: NameCount[];
  os: NameCount[];
}

const empty: PostHogInsights = {
  configured: false,
  activeNow: 0, uniques24h: 0, sessions24h: 0, avgSessionSec: 0,
  pageviews24h: 0, pageviews7d: 0, errors24h: 0,
  trend: [], topPages: [], topEvents: [], referrers: [], countries: [], browsers: [], devices: [], os: [],
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
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`PostHog ${res.status}`);
  const data = (await res.json()) as { results?: unknown[][] };
  return data.results ?? [];
}

const PV = "'$pageview'";
const EX = "'$exception'";

export async function getPostHogInsights(): Promise<PostHogInsights> {
  const key = process.env.POSTHOG_PERSONAL_API_KEY;
  if (!key) return empty;
  const apiHost = posthogApiHost();
  try {
    const pid = await posthogProjectId(apiHost, key);
    if (!pid) return { ...empty, configured: true, error: "No PostHog project found" };
    const run = (sql: string) => hogql(apiHost, key, pid, sql);

    const [
      active, uniques, sessions, pv24, pv7, errors, trend,
      pages, events, refs, countries, browsers, devices, os,
    ] = await Promise.all([
      run("SELECT count(DISTINCT distinct_id) FROM events WHERE timestamp > now() - INTERVAL 30 MINUTE"),
      run("SELECT count(DISTINCT person_id) FROM events WHERE timestamp > now() - INTERVAL 24 HOUR"),
      run("SELECT count(), round(avg($session_duration)) FROM sessions WHERE $start_timestamp > now() - INTERVAL 24 HOUR"),
      run(`SELECT count() FROM events WHERE event = ${PV} AND timestamp > now() - INTERVAL 24 HOUR`),
      run(`SELECT count() FROM events WHERE event = ${PV} AND timestamp > now() - INTERVAL 7 DAY`),
      run(`SELECT count() FROM events WHERE event = ${EX} AND timestamp > now() - INTERVAL 24 HOUR`),
      run(`SELECT toDate(timestamp) AS d, count() AS c FROM events WHERE event = ${PV} AND timestamp > now() - INTERVAL 14 DAY GROUP BY d ORDER BY d`),
      run(`SELECT properties.$pathname AS p, count() AS c FROM events WHERE event = ${PV} AND timestamp > now() - INTERVAL 24 HOUR GROUP BY p ORDER BY c DESC LIMIT 10`),
      run("SELECT event, count() AS c FROM events WHERE timestamp > now() - INTERVAL 24 HOUR GROUP BY event ORDER BY c DESC LIMIT 10"),
      run(`SELECT properties.$referring_domain AS r, count() AS c FROM events WHERE event = ${PV} AND timestamp > now() - INTERVAL 7 DAY GROUP BY r ORDER BY c DESC LIMIT 8`),
      run("SELECT properties.$geoip_country_name AS c, count(DISTINCT person_id) AS u FROM events WHERE timestamp > now() - INTERVAL 7 DAY GROUP BY c ORDER BY u DESC LIMIT 8"),
      run(`SELECT properties.$browser AS b, count() AS c FROM events WHERE event = ${PV} AND timestamp > now() - INTERVAL 7 DAY GROUP BY b ORDER BY c DESC LIMIT 6`),
      run(`SELECT properties.$device_type AS d, count() AS c FROM events WHERE event = ${PV} AND timestamp > now() - INTERVAL 7 DAY GROUP BY d ORDER BY c DESC LIMIT 5`),
      run(`SELECT properties.$os AS o, count() AS c FROM events WHERE event = ${PV} AND timestamp > now() - INTERVAL 7 DAY GROUP BY o ORDER BY c DESC LIMIT 6`),
    ]);

    const n = (v: unknown) => Number(v ?? 0) || 0;
    const nc = (rows: unknown[][], fallback = "Unknown"): NameCount[] =>
      rows.map((r) => ({ name: (r[0] === null || r[0] === "" || r[0] === undefined ? fallback : String(r[0])), count: n(r[1]) }));

    return {
      configured: true,
      activeNow: n(active[0]?.[0]),
      uniques24h: n(uniques[0]?.[0]),
      sessions24h: n(sessions[0]?.[0]),
      avgSessionSec: n(sessions[0]?.[1]),
      pageviews24h: n(pv24[0]?.[0]),
      pageviews7d: n(pv7[0]?.[0]),
      errors24h: n(errors[0]?.[0]),
      trend: trend.map((r) => ({ date: String(r[0] ?? ""), views: n(r[1]) })),
      topPages: pages.map((r) => ({ path: String(r[0] ?? "/"), views: n(r[1]) })),
      topEvents: nc(events),
      referrers: nc(refs, "Direct").map((r) => ({ name: r.name === "$direct" ? "Direct" : r.name, count: r.count })),
      countries: nc(countries),
      browsers: nc(browsers),
      devices: nc(devices),
      os: nc(os),
    };
  } catch (e) {
    return { ...empty, configured: true, error: e instanceof Error ? e.message : "PostHog error" };
  }
}
