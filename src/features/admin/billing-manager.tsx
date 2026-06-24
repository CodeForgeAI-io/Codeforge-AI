"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import {
  Crown,
  CreditCard,
  Loader2,
  Search,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from "@/components/icons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface Usage {
  period: string;
  used: number;
  allowance: number | null;
  remaining: number | null;
  unlimited: boolean;
}
interface BillingRow {
  id: string;
  name: string;
  username: string;
  email: string;
  image: string | null;
  plan: "free" | "go" | "plus";
  active: boolean;
  billingCycle: "monthly" | "yearly" | null;
  planExpiresAt: string | null;
  trialEndsAt: string | null;
  usage: Usage;
  revenue: number;
  payments: number;
  currency: string;
  lastPaymentAt: string | null;
  createdAt: string;
}
interface Summary {
  totalRevenue: number;
  totalPayments: number;
  currency: string;
  payingUsers: number;
  creditsUsedThisMonth: number;
}

const PLAN_META = {
  free: { label: "Free", bg: "bg-muted/50 border-border text-muted-foreground", icon: null },
  go: { label: "Go", bg: "bg-blue-500/10 border-blue-500/30 text-blue-500", icon: Zap },
  plus: { label: "Plus", bg: "bg-yellow-500/10 border-yellow-500/30 text-yellow-500", icon: Crown },
} as const;

function money(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}

function PlanBadge({ plan }: { plan: BillingRow["plan"] }) {
  const meta = PLAN_META[plan] ?? PLAN_META.free;
  const Icon = meta.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold", meta.bg)}>
      {Icon && <Icon className="size-3" />}
      {meta.label}
    </span>
  );
}

function UsageBar({ usage }: { usage: Usage }) {
  if (usage.unlimited) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
        <Sparkles className="size-3" /> Unlimited · {usage.used.toLocaleString()} used
      </span>
    );
  }
  const allowance = usage.allowance ?? 0;
  const pct = allowance ? Math.min(100, Math.round((usage.used / allowance) * 100)) : 0;
  const near = pct >= 80;
  return (
    <div className="w-32">
      <div className="mb-1 flex justify-between text-[11px] tabular-nums text-muted-foreground">
        <span>{usage.used.toLocaleString()} / {allowance.toLocaleString()}</span>
        <span className={cn(near && "font-medium text-amber-500")}>{pct}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full", near ? "bg-amber-500" : "bg-primary")}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, hint }: { icon: typeof Users; label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4" />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function BillingManager() {
  const [q, setQ] = useState("");
  const [plan, setPlan] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-billing", q, plan],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (plan !== "all") params.set("plan", plan);
      const res = await fetch(`/api/admin/billing?${params}`);
      if (!res.ok) throw new Error("Failed to load billing");
      return (await res.json()) as { rows: BillingRow[]; period: string; summary: Summary };
    },
  });

  const rows = data?.rows ?? [];
  const summary = data?.summary;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Billing &amp; Usage</h1>
        <p className="text-sm text-muted-foreground">
          Every user&rsquo;s plan, AI credit consumption and payment history
          {data?.period ? ` · ${format(new Date(data.period + "-01"), "MMMM yyyy")}` : ""}.
        </p>
      </div>

      {/* summary */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={TrendingUp}
          label="Total revenue"
          value={summary ? money(summary.totalRevenue, summary.currency) : "—"}
          hint={summary ? `${summary.totalPayments} payments` : undefined}
        />
        <StatCard icon={Crown} label="Paying users" value={summary ? summary.payingUsers.toLocaleString() : "—"} />
        <StatCard
          icon={Sparkles}
          label="AI credits this month"
          value={summary ? summary.creditsUsedThisMonth.toLocaleString() : "—"}
        />
        <StatCard icon={Users} label="Users shown" value={rows.length.toLocaleString()} hint="Most recent 200" />
      </div>

      {/* filters */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, email or username…"
            className="pl-9"
          />
        </div>
        <Select value={plan} onValueChange={setPlan}>
          <SelectTrigger className="sm:w-40">
            <SelectValue placeholder="All plans" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All plans</SelectItem>
            <SelectItem value="free">Free</SelectItem>
            <SelectItem value="go">Go</SelectItem>
            <SelectItem value="plus">Plus</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* table */}
      <div className="overflow-x-auto rounded-xl border bg-card">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
            <CreditCard className="size-6" />
            <p className="text-sm">No users found</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>AI credits</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead>Last payment</TableHead>
                <TableHead>Renews / expires</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Avatar className="size-8">
                        <AvatarImage src={r.image ?? undefined} />
                        <AvatarFallback>{r.name?.[0]?.toUpperCase() ?? "?"}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{r.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{r.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <PlanBadge plan={r.plan} />
                      {r.billingCycle && r.plan !== "free" && (
                        <span className="text-[11px] text-muted-foreground">{r.billingCycle}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <UsageBar usage={r.usage} />
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-sm font-semibold tabular-nums">
                      {r.revenue > 0 ? money(r.revenue, r.currency) : <span className="text-muted-foreground">—</span>}
                    </span>
                    {r.payments > 0 && (
                      <p className="text-[11px] text-muted-foreground">{r.payments} payment{r.payments > 1 ? "s" : ""}</p>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {r.lastPaymentAt ? formatDistanceToNow(new Date(r.lastPaymentAt), { addSuffix: true }) : "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {r.trialEndsAt && new Date(r.trialEndsAt) > new Date() ? (
                      <span className="text-amber-500">Trial · {format(new Date(r.trialEndsAt), "MMM d")}</span>
                    ) : r.planExpiresAt ? (
                      format(new Date(r.planExpiresAt), "MMM d, yyyy")
                    ) : (
                      "—"
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
