"use client";

import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, TrendingUp, Search, BarChart3 } from "@/components/icons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const fmt = (n: number) => n.toLocaleString();

interface PostHog {
  configured: boolean; error?: string;
  activeNow: number; users24h: number; pageviews24h: number; pageviews7d: number;
  topPages: { path: string; views: number }[];
  topEvents: { event: string; count: number }[];
}
interface Ga4 {
  configured: boolean; error?: string;
  activeUsers: number;
  topPages: { path: string; users: number }[];
  topCountries: { country: string; users: number }[];
}
interface Gsc {
  configured: boolean; error?: string;
  clicks: number; impressions: number; ctr: number; position: number;
  topQueries: { query: string; clicks: number; impressions: number }[];
  topPages: { page: string; clicks: number; impressions: number }[];
}

function useInsight<T>(source: string, refetchInterval?: number) {
  return useQuery<T>({
    queryKey: ["admin-insight", source],
    queryFn: async () => {
      const res = await fetch(`/api/admin/insights/${source}`);
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
    refetchInterval,
  });
}

export function InsightsView() {
  return (
    <div className="space-y-4">
      <PostHogSection />
      <div className="grid gap-4 lg:grid-cols-2">
        <Ga4Section />
        <GscSection />
      </div>
    </div>
  );
}

// ── PostHog ──────────────────────────────────────────────────────────────────
function PostHogSection() {
  const { data, isLoading } = useInsight<PostHog>("posthog", 30_000);

  return (
    <Section
      icon={<TrendingUp className="size-4" />}
      title="PostHog — Product Analytics"
      live
      loading={isLoading}
      configured={data?.configured}
      error={data?.error}
      setup="Set POSTHOG_PERSONAL_API_KEY (and optionally POSTHOG_PROJECT_ID) in your environment."
    >
      {data && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Active now" value={fmt(data.activeNow)} accent hint="last 30 min" />
            <Stat label="Users (24h)" value={fmt(data.users24h)} />
            <Stat label="Pageviews (24h)" value={fmt(data.pageviews24h)} />
            <Stat label="Pageviews (7d)" value={fmt(data.pageviews7d)} />
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <RankList title="Top pages (24h)" rows={data.topPages.map((p) => [p.path, fmt(p.views)])} />
            <RankList title="Top events (24h)" rows={data.topEvents.map((e) => [e.event, fmt(e.count)])} />
          </div>
        </>
      )}
    </Section>
  );
}

// ── GA4 ──────────────────────────────────────────────────────────────────────
function Ga4Section() {
  const { data, isLoading } = useInsight<Ga4>("ga4", 30_000);

  return (
    <Section
      icon={<BarChart3 className="size-4" />}
      title="Google Analytics — Realtime"
      live
      loading={isLoading}
      configured={data?.configured}
      error={data?.error}
      setup="Set GA4_PROPERTY_ID and GOOGLE_SERVICE_ACCOUNT_JSON (service account with GA4 access)."
    >
      {data && (
        <>
          <Stat label="Active users" value={fmt(data.activeUsers)} accent hint="right now" />
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <RankList title="Top pages" rows={data.topPages.map((p) => [p.path || "(not set)", fmt(p.users)])} />
            <RankList title="Top countries" rows={data.topCountries.map((c) => [c.country || "—", fmt(c.users)])} />
          </div>
        </>
      )}
    </Section>
  );
}

// ── GSC ──────────────────────────────────────────────────────────────────────
function GscSection() {
  const { data, isLoading } = useInsight<Gsc>("search-console");

  return (
    <Section
      icon={<Search className="size-4" />}
      title="Search Console — last 28 days"
      loading={isLoading}
      configured={data?.configured}
      error={data?.error}
      setup="Set GSC_SITE_URL (e.g. sc-domain:codeforgeai.io) and GOOGLE_SERVICE_ACCOUNT_JSON (added to the property)."
    >
      {data && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Clicks" value={fmt(data.clicks)} accent />
            <Stat label="Impressions" value={fmt(data.impressions)} />
            <Stat label="CTR" value={`${data.ctr}%`} />
            <Stat label="Avg position" value={String(data.position)} />
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <RankList title="Top queries" rows={data.topQueries.map((q) => [q.query, fmt(q.clicks)])} />
            <RankList title="Top pages" rows={data.topPages.map((p) => [p.page.replace(/^https?:\/\/[^/]+/, "") || "/", fmt(p.clicks)])} />
          </div>
        </>
      )}
    </Section>
  );
}

// ── Shared ────────────────────────────────────────────────────────────────────
function Section({
  icon, title, live, loading, configured, error, setup, children,
}: {
  icon: ReactNode; title: string; live?: boolean; loading?: boolean;
  configured?: boolean; error?: string; setup: string; children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <span className="flex size-7 items-center justify-center rounded-md bg-[#006bff]/10 text-[#006bff]">{icon}</span>
          {title}
          {live && configured && (
            <span className="ml-1 inline-flex items-center gap-1 text-[11px] font-medium text-easy">
              <span className="size-1.5 animate-pulse rounded-full bg-easy" /> live
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
        ) : configured === false ? (
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            <Badge variant="secondary" className="mb-2">Not configured</Badge>
            <p>{setup}</p>
          </div>
        ) : error ? (
          <div className="rounded-lg border border-dashed border-destructive/40 p-4 text-sm text-destructive">
            Couldn&apos;t load: {error}
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

function Stat({ label, value, hint, accent }: { label: string; value: string; hint?: string; accent?: boolean }) {
  return (
    <div className="rounded-lg border bg-muted/20 p-3">
      <p className={`text-2xl font-semibold tabular-nums ${accent ? "text-[#006bff]" : ""}`}>{value}</p>
      <p className="text-xs text-muted-foreground">
        {label}
        {hint && <span className="text-muted-foreground/60"> · {hint}</span>}
      </p>
    </div>
  );
}

function RankList({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      {rows.length === 0 ? (
        <p className="py-4 text-center text-xs text-muted-foreground">No data yet.</p>
      ) : (
        <ul className="divide-y text-sm">
          {rows.map(([k, v], i) => (
            <li key={`${k}-${i}`} className="flex items-center justify-between gap-3 py-1.5">
              <span className="min-w-0 truncate text-muted-foreground">{k}</span>
              <span className="shrink-0 font-semibold tabular-nums">{v}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
