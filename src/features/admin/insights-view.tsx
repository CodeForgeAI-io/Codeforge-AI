"use client";

import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  Loader2, TrendingUp, Users, Layers, Globe, MonitorPlay, AlertTriangle, Clock,
} from "@/components/icons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const fmt = (n: number) => n.toLocaleString();
function duration(sec: number): string {
  if (!sec) return "0s";
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return m ? `${m}m ${s}s` : `${s}s`;
}

interface NameCount { name: string; count: number }
interface PostHog {
  configured: boolean; error?: string;
  activeNow: number; uniques24h: number; sessions24h: number; avgSessionSec: number;
  pageviews24h: number; pageviews7d: number; errors24h: number;
  trend: { date: string; views: number }[];
  topPages: { path: string; views: number }[];
  topEvents: NameCount[];
  referrers: NameCount[]; countries: NameCount[]; browsers: NameCount[];
  devices: NameCount[]; os: NameCount[];
}

export function InsightsView() {
  const { data, isLoading } = useQuery<PostHog>({
    queryKey: ["admin-insight", "posthog"],
    queryFn: async () => {
      const res = await fetch("/api/admin/insights/posthog");
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
    refetchInterval: 30_000,
  });

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>;
  }
  if (!data?.configured) {
    return (
      <Card><CardContent className="p-4">
        <Badge variant="secondary" className="mb-2">Not configured</Badge>
        <p className="text-sm text-muted-foreground">Set POSTHOG_PERSONAL_API_KEY (and optionally POSTHOG_PROJECT_ID) to enable PostHog insights.</p>
      </CardContent></Card>
    );
  }
  if (data.error) {
    return <Card><CardContent className="p-4 text-sm text-destructive">Couldn&apos;t load PostHog: {data.error}</CardContent></Card>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="flex size-7 items-center justify-center rounded-md bg-[#006bff]/10 text-[#006bff]"><TrendingUp className="size-4" /></span>
        <h2 className="text-sm font-semibold">PostHog — Product Analytics</h2>
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-easy">
          <span className="size-1.5 animate-pulse rounded-full bg-easy" /> live · auto-refresh 30s
        </span>
      </div>

      {/* Headline stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        <Stat icon={<Users className="size-3.5" />} label="Active now" hint="30 min" value={fmt(data.activeNow)} accent />
        <Stat icon={<Users className="size-3.5" />} label="Visitors" hint="24h" value={fmt(data.uniques24h)} />
        <Stat icon={<Layers className="size-3.5" />} label="Sessions" hint="24h" value={fmt(data.sessions24h)} />
        <Stat icon={<Clock className="size-3.5" />} label="Avg session" value={duration(data.avgSessionSec)} />
        <Stat icon={<TrendingUp className="size-3.5" />} label="Pageviews" hint="24h" value={fmt(data.pageviews24h)} />
        <Stat icon={<TrendingUp className="size-3.5" />} label="Pageviews" hint="7d" value={fmt(data.pageviews7d)} />
        <Stat icon={<AlertTriangle className="size-3.5" />} label="Errors" hint="24h" value={fmt(data.errors24h)} warn={data.errors24h > 0} />
      </div>

      {/* Trend */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Pageviews — last 14 days</CardTitle></CardHeader>
        <CardContent className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.trend}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="date" tickFormatter={(d) => String(d).slice(5)} fontSize={11} />
              <YAxis allowDecimals={false} width={30} fontSize={11} />
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="views" stroke="#006bff" fill="#006bff" fillOpacity={0.2} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Breakdowns */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Panel title="Top pages" hint="24h"><RankList rows={data.topPages.map((p) => [p.path, fmt(p.views)])} /></Panel>
        <Panel title="Top events" hint="24h"><RankList rows={data.topEvents.map((e) => [e.name, fmt(e.count)])} /></Panel>
        <Panel title="Referrers / sources" hint="7d" icon={<Globe className="size-3.5" />}><RankList rows={data.referrers.map((r) => [r.name, fmt(r.count)])} /></Panel>
        <Panel title="Countries" hint="7d" icon={<Globe className="size-3.5" />}><RankList rows={data.countries.map((c) => [c.name, fmt(c.count)])} /></Panel>
        <Panel title="Browsers" hint="7d" icon={<MonitorPlay className="size-3.5" />}><RankList rows={data.browsers.map((b) => [b.name, fmt(b.count)])} /></Panel>
        <Panel title="Devices & OS" hint="7d" icon={<MonitorPlay className="size-3.5" />}>
          <RankList rows={[...data.devices.map((d) => [d.name, fmt(d.count)] as [string, string]), ...data.os.map((o) => [o.name, fmt(o.count)] as [string, string])]} />
        </Panel>
      </div>
    </div>
  );
}

function Stat({ icon, label, hint, value, accent, warn }: {
  icon: ReactNode; label: string; hint?: string; value: string; accent?: boolean; warn?: boolean;
}) {
  return (
    <div className="rounded-lg border bg-muted/20 p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}{hint && <span className="text-muted-foreground/60">· {hint}</span>}
      </div>
      <p className={`mt-1 text-2xl font-semibold tabular-nums ${accent ? "text-[#006bff]" : warn ? "text-warning" : ""}`}>{value}</p>
    </div>
  );
}

function Panel({ title, hint, icon, children }: { title: string; hint?: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-1.5 text-sm">
          {icon}{title}
          {hint && <span className="ml-auto text-[11px] font-normal text-muted-foreground">{hint}</span>}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function RankList({ rows }: { rows: [string, string][] }) {
  if (rows.length === 0) return <p className="py-4 text-center text-xs text-muted-foreground">No data yet.</p>;
  return (
    <ul className="divide-y text-sm">
      {rows.map(([k, v], i) => (
        <li key={`${k}-${i}`} className="flex items-center justify-between gap-3 py-1.5">
          <span className="min-w-0 truncate text-muted-foreground">{k}</span>
          <span className="shrink-0 font-semibold tabular-nums">{v}</span>
        </li>
      ))}
    </ul>
  );
}
