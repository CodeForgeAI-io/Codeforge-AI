import { supabaseAdmin } from "@/lib/supabase/admin";
import { redis } from "@/lib/redis";
import { storageEnabled } from "@/lib/storage";
import { getFeatureAccess } from "@/services/feature-access";
import { FEATURE_CATALOG } from "@/lib/feature-catalog";

/**
 * Live system status for the public /status page.
 *
 * Every check is time-boxed and failure-tolerant: a check that throws or times
 * out is reported as "down" rather than breaking the page. Results are cached
 * upstream (see the route) so public traffic never hammers a dependency.
 */

export type Health = "operational" | "degraded" | "down" | "not_configured";

export interface ServiceStatus {
  name: string;
  description: string;
  status: Health;
  latencyMs: number | null;
  detail?: string;
}

export interface FeatureStatus {
  id: string;
  label: string;
  description: string;
  group: string;
  kind: "feature" | "tool";
  /** Minimum plan required right now (admin overrides applied). */
  minPlan: string;
  status: Health;
}

export interface SystemStatus {
  overall: Health;
  checkedAt: string;
  services: ServiceStatus[];
  features: FeatureStatus[];
}

const TIMEOUT = 4000;

/** Run a check, timing it, converting any failure into a "down" result. */
async function check(
  name: string,
  description: string,
  fn: () => Promise<{ status: Health; detail?: string }>,
): Promise<ServiceStatus> {
  const started = Date.now();
  try {
    const out = await Promise.race([
      fn(),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Timed out")), TIMEOUT)),
    ]);
    return { name, description, status: out.status, latencyMs: Date.now() - started, detail: out.detail };
  } catch (e) {
    return {
      name,
      description,
      status: "down",
      latencyMs: Date.now() - started,
      detail: e instanceof Error ? e.message : "Check failed",
    };
  }
}

async function checkDatabase() {
  return check("Database", "Supabase Postgres — problems, submissions, accounts.", async () => {
    const { error } = await supabaseAdmin().from("users").select("id", { count: "exact", head: true }).limit(1);
    if (error) return { status: "down" as Health, detail: error.message };
    return { status: "operational" as Health };
  });
}

async function checkCache() {
  return check("Cache", "Upstash Redis — leaderboards and rate limiting.", async () => {
    if (!redis) return { status: "not_configured" as Health, detail: "Using in-process cache fallback" };
    const pong = await redis.ping();
    return pong ? { status: "operational" as Health } : { status: "degraded" as Health };
  });
}

async function checkAuth() {
  return check("Authentication", "Supabase Auth — sign-in, OAuth and passkeys.", async () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!url) return { status: "not_configured" as Health };
    const res = await fetch(`${url}/auth/v1/settings`, {
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "" },
      signal: AbortSignal.timeout(TIMEOUT),
    });
    return res.ok ? { status: "operational" as Health } : { status: "degraded" as Health, detail: `HTTP ${res.status}` };
  });
}

async function checkAi() {
  return check("AI Mentor", "Groq — streaming AI mentor, pair programmer and tools.", async () => {
    if (!process.env.GROQ_API_KEY) return { status: "not_configured" as Health };
    const res = await fetch("https://api.groq.com/openai/v1/models", {
      headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      signal: AbortSignal.timeout(TIMEOUT),
    });
    return res.ok ? { status: "operational" as Health } : { status: "degraded" as Health, detail: `HTTP ${res.status}` };
  });
}

async function checkExecution() {
  const provider = process.env.EXECUTION_PROVIDER ?? "paiza";
  return check("Code Execution", `Runs your code in 12 languages (${provider}).`, async () => {
    if (provider === "piston") {
      const base = process.env.PISTON_URL;
      if (!base) return { status: "not_configured" as Health, detail: "PISTON_URL not set" };
      const res = await fetch(`${base}/api/v2/runtimes`, { signal: AbortSignal.timeout(TIMEOUT) });
      return res.ok ? { status: "operational" as Health } : { status: "degraded" as Health, detail: `HTTP ${res.status}` };
    }
    if (provider === "judge0") {
      if (!process.env.JUDGE0_API_KEY) return { status: "not_configured" as Health, detail: "JUDGE0_API_KEY not set" };
      return { status: "operational" as Health };
    }
    // paiza (default) — the runner status endpoint answers 200 for an unknown
    // id, which proves the API is serving without submitting a real job.
    const base = process.env.PAIZA_URL ?? "https://api.paiza.io";
    const res = await fetch(`${base}/runners/get_status?id=status-probe&api_key=guest`, {
      signal: AbortSignal.timeout(TIMEOUT),
    });
    return res.ok ? { status: "operational" as Health } : { status: "degraded" as Health, detail: `HTTP ${res.status}` };
  });
}

async function checkStorage() {
  return check("File Storage", "Supabase Storage — avatars, covers and résumés.", async () => {
    if (!storageEnabled()) return { status: "not_configured" as Health };
    return { status: "operational" as Health };
  });
}

async function checkPayments() {
  return check("Payments", "Razorpay — subscriptions and invoices.", async () => {
    const on = !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
    return on ? { status: "operational" as Health } : { status: "not_configured" as Health };
  });
}

async function checkEmail() {
  return check("Email", "Transactional email — account and billing notices.", async () => {
    const on = !!(process.env.SMTP_USER && process.env.SMTP_PASS);
    return on ? { status: "operational" as Health } : { status: "not_configured" as Health };
  });
}

/** Worst-case roll-up. "not_configured" is not an outage. */
function rollUp(services: ServiceStatus[]): Health {
  if (services.some((s) => s.status === "down")) return "down";
  if (services.some((s) => s.status === "degraded")) return "degraded";
  return "operational";
}

export async function getSystemStatus(): Promise<SystemStatus> {
  const services = await Promise.all([
    checkDatabase(),
    checkAuth(),
    checkExecution(),
    checkAi(),
    checkCache(),
    checkStorage(),
    checkPayments(),
    checkEmail(),
  ]);

  // Feature/tool availability (admin overrides applied).
  let features: FeatureStatus[] = [];
  try {
    const access = await getFeatureAccess();
    const aiDown = services.find((s) => s.name === "AI Mentor")?.status;
    const execDown = services.find((s) => s.name === "Code Execution")?.status;
    features = FEATURE_CATALOG.map((f) => {
      const minPlan = access[f.id] ?? f.defaultMinPlan;
      // A tool is only as healthy as the provider behind it.
      let status: Health = "operational";
      if (f.group === "AI Tools" && aiDown && aiDown !== "operational") status = aiDown;
      if (f.id === "coreProblems" && execDown && execDown !== "operational") status = execDown;
      return {
        id: f.id,
        label: f.label,
        description: f.description,
        group: f.group,
        kind: f.kind,
        minPlan,
        status,
      };
    });
  } catch {
    // Feature access is best-effort; never fail the status page over it.
  }

  return {
    overall: rollUp(services),
    checkedAt: new Date().toISOString(),
    services,
    features,
  };
}
