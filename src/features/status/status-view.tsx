"use client";

import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, AlertTriangle, XCircle, Loader2, Circle } from "@/components/icons";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Health = "operational" | "degraded" | "down" | "not_configured";

interface DayBar { date: string; status: Health | "no_data"; uptime: number | null }
interface ServiceStatus {
  name: string; description: string; status: Health; latencyMs: number | null; detail?: string;
  days: DayBar[]; uptime30d: number | null;
}
interface FeatureStatus {
  id: string; label: string; description: string; group: string;
  kind: "feature" | "tool"; minPlan: string; status: Health;
}
interface SystemStatus {
  overall: Health; checkedAt: string; services: ServiceStatus[]; features: FeatureStatus[];
}

const LABEL: Record<Health, string> = {
  operational: "Operational",
  degraded: "Degraded",
  down: "Outage",
  not_configured: "Not enabled",
};

function StatusIcon({ status, className }: { status: Health; className?: string }) {
  const cls = cn("size-4 shrink-0", className);
  if (status === "operational") return <CheckCircle2 className={cn(cls, "text-easy")} />;
  if (status === "degraded") return <AlertTriangle className={cn(cls, "text-warning")} />;
  if (status === "down") return <XCircle className={cn(cls, "text-destructive")} />;
  return <Circle className={cn(cls, "text-muted-foreground")} />;
}

const BAR: Record<DayBar["status"], string> = {
  operational: "bg-easy",
  degraded: "bg-warning",
  down: "bg-destructive",
  not_configured: "bg-muted",
  no_data: "bg-muted",
};

/** Statuspage-style uptime grid: one bar per day, oldest → newest. */
function UptimeBars({ days, uptime }: { days: DayBar[]; uptime: number | null }) {
  if (!days.length) return null;
  const first = days[0]?.date;
  return (
    <div className="mt-2.5">
      <div className="flex h-7 items-stretch gap-0.5">
        {days.map((d) => (
          <span
            key={d.date}
            title={
              d.status === "no_data"
                ? `${d.date} · no data`
                : `${d.date} · ${d.uptime}% uptime (${LABEL[d.status as Health]})`
            }
            className={cn(
              "flex-1 rounded-[2px] transition-opacity hover:opacity-70",
              BAR[d.status],
              d.status === "no_data" && "opacity-50",
            )}
          />
        ))}
      </div>
      <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
        <span>{first}</span>
        <span className="font-medium">
          {uptime === null ? "No data yet" : `${uptime}% uptime`}
        </span>
        <span>Today</span>
      </div>
    </div>
  );
}

export function StatusView() {
  const { data, isLoading } = useQuery<SystemStatus>({
    queryKey: ["system-status"],
    queryFn: async () => {
      const res = await fetch("/api/status");
      if (!res.ok) throw new Error("Failed to load status");
      return res.json();
    },
    refetchInterval: 30_000,
  });

  if (isLoading || !data) {
    return <div className="flex justify-center py-20"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>;
  }

  const banner =
    data.overall === "operational"
      ? { text: "All systems operational", cls: "border-easy/30 bg-easy/10 text-easy" }
      : data.overall === "degraded"
        ? { text: "Some systems degraded", cls: "border-warning/30 bg-warning/10 text-warning" }
        : { text: "Active outage", cls: "border-destructive/30 bg-destructive/10 text-destructive" };

  const groups = [...new Set(data.features.map((f) => f.group))];

  return (
    <div className="space-y-6">
      {/* Overall banner */}
      <div className={cn("flex items-center gap-2.5 rounded-xl border px-4 py-3 font-semibold", banner.cls)}>
        <StatusIcon status={data.overall} className="size-5" />
        {banner.text}
        <span className="ml-auto text-xs font-normal opacity-70">
          Checked {new Date(data.checkedAt).toLocaleTimeString()}
        </span>
      </div>

      {/* Services */}
      <section>
        <h2 className="mb-2 text-sm font-semibold">Services</h2>
        <Card>
          <CardContent className="divide-y p-0">
            {data.services.map((s) => (
              <div key={s.name} className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <StatusIcon status={s.status} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{s.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {s.detail ? `${s.description} · ${s.detail}` : s.description}
                    </p>
                  </div>
                  {s.latencyMs !== null && s.status !== "not_configured" && (
                    <span className="hidden text-xs tabular-nums text-muted-foreground sm:inline">{s.latencyMs}ms</span>
                  )}
                  <span className="shrink-0 text-xs font-medium text-muted-foreground">{LABEL[s.status]}</span>
                </div>
                <UptimeBars days={s.days} uptime={s.uptime30d} />
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      {/* Features & tools */}
      {groups.map((group) => (
        <section key={group}>
          <h2 className="mb-2 text-sm font-semibold">{group}</h2>
          <Card>
            <CardContent className="divide-y p-0">
              {data.features.filter((f) => f.group === group).map((f) => (
                <div key={f.id} className="flex items-center gap-3 px-4 py-3">
                  <StatusIcon status={f.status} />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 text-sm font-medium">
                      {f.label}
                      {f.minPlan !== "free" && (
                        <Badge variant="secondary" className="h-4 px-1.5 text-[10px] uppercase">{f.minPlan}</Badge>
                      )}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{f.description}</p>
                  </div>
                  <span className="shrink-0 text-xs font-medium text-muted-foreground">{LABEL[f.status]}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      ))}

      <p className="text-center text-xs text-muted-foreground">
        &ldquo;Not enabled&rdquo; means the integration isn&apos;t configured on this deployment — it is not an outage.
      </p>
    </div>
  );
}
