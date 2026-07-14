"use client";

import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp,
  Clock,
  GraduationCap,
  CircleDollarSign,
  Loader2,
} from "@/components/icons";
import { Card, CardContent } from "@/components/ui/card";

interface Metrics {
  growth: {
    totalUsers: number;
    newUsers: { today: number; week: number; month: number };
    activeUsers: { dau: number; wau: number; mau: number };
  };
  retention: { day1: number | null; day7: number | null; avgSessionMinutes: number | null };
  learning: { problemsSolved: number; aiMentorUsage: number; resumeReviews: number; courseCompletions: number };
  business: {
    trialUsers: number;
    paidUsers: number;
    mrr: number;
    currency: string;
    conversionRate: number;
    churnRate: number | null;
  };
}

const fmt = (n: number) => n.toLocaleString();
const pct = (n: number | null) => (n === null ? "—" : `${n}%`);
function money(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}

export function KpiMetrics() {
  const { data, isLoading } = useQuery<Metrics>({
    queryKey: ["admin-metrics"],
    queryFn: async () => {
      const res = await fetch("/api/admin/metrics");
      if (!res.ok) throw new Error("Failed to load metrics");
      return res.json();
    },
  });

  if (isLoading || !data) {
    return (
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="flex h-40 items-center justify-center">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const { growth, retention, learning, business } = data;

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <Group icon={<TrendingUp className="size-4" />} title="Growth">
        <Row label="Total users" value={fmt(growth.totalUsers)} />
        <Triple
          label="New users"
          parts={[
            ["Today", fmt(growth.newUsers.today)],
            ["Week", fmt(growth.newUsers.week)],
            ["Month", fmt(growth.newUsers.month)],
          ]}
        />
        <Triple
          label="Active users"
          parts={[
            ["DAU", fmt(growth.activeUsers.dau)],
            ["WAU", fmt(growth.activeUsers.wau)],
            ["MAU", fmt(growth.activeUsers.mau)],
          ]}
        />
      </Group>

      <Group icon={<Clock className="size-4" />} title="Retention">
        <Row label="Day 1 retention" value={pct(retention.day1)} />
        <Row label="Day 7 retention" value={pct(retention.day7)} />
        <Row
          label="Avg. session time"
          value={retention.avgSessionMinutes === null ? "—" : `${retention.avgSessionMinutes}m`}
          hint={retention.avgSessionMinutes === null ? "Not tracked" : undefined}
        />
      </Group>

      <Group icon={<GraduationCap className="size-4" />} title="Learning">
        <Row label="Problems solved" value={fmt(learning.problemsSolved)} />
        <Row label="AI Mentor chats" value={fmt(learning.aiMentorUsage)} />
        <Row label="Resume reviews" value={fmt(learning.resumeReviews)} />
        <Row label="Course completions" value={fmt(learning.courseCompletions)} />
      </Group>

      <Group icon={<CircleDollarSign className="size-4" />} title="Business">
        <Row label="MRR" value={money(business.mrr, business.currency)} strong />
        <Triple
          label="Users"
          parts={[
            ["Trial", fmt(business.trialUsers)],
            ["Paid", fmt(business.paidUsers)],
            ["Conv.", `${business.conversionRate}%`],
          ]}
        />
        <Row label="Churn rate" value={pct(business.churnRate)} hint="30-day, approx." />
      </Group>
    </div>
  );
}

function Group({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-md bg-[#006bff]/10 text-[#006bff]">
            {icon}
          </span>
          <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
        </div>
        <div className="divide-y">{children}</div>
      </CardContent>
    </Card>
  );
}

function Row({
  label,
  value,
  hint,
  strong,
}: {
  label: string;
  value: string;
  hint?: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2 first:pt-0 last:pb-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="flex items-baseline gap-2 text-right">
        {hint && <span className="text-[11px] text-muted-foreground/70">{hint}</span>}
        <span className={strong ? "text-lg font-semibold tabular-nums" : "text-sm font-semibold tabular-nums"}>
          {value}
        </span>
      </span>
    </div>
  );
}

function Triple({ label, parts }: { label: string; parts: [string, string][] }) {
  return (
    <div className="py-2 first:pt-0 last:pb-0">
      <p className="mb-1.5 text-sm text-muted-foreground">{label}</p>
      <div className="grid grid-cols-3 gap-2">
        {parts.map(([k, v]) => (
          <div key={k} className="rounded-md border bg-muted/30 px-2 py-1.5 text-center">
            <p className="text-sm font-semibold tabular-nums leading-none">{v}</p>
            <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">{k}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
