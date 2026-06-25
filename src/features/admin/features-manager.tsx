"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Crown, Loader2, Lock, Sparkles, Zap } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PlanId = "free" | "go" | "plus";
interface CatalogItem {
  id: string;
  label: string;
  description: string;
  group: string;
  kind: "feature" | "tool";
  defaultMinPlan: PlanId;
  pricing: boolean;
}

const PLAN_OPTIONS: { id: PlanId; label: string; icon: typeof Zap | null; cls: string }[] = [
  { id: "free", label: "Free", icon: null, cls: "data-[on=true]:bg-muted data-[on=true]:text-foreground" },
  { id: "go", label: "Go", icon: Zap, cls: "data-[on=true]:bg-blue-500 data-[on=true]:text-white" },
  { id: "plus", label: "Plus", icon: Crown, cls: "data-[on=true]:bg-yellow-500 data-[on=true]:text-black" },
];

export function FeaturesManager() {
  const [access, setAccess] = useState<Record<string, PlanId>>({});
  const [dirty, setDirty] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-features"],
    queryFn: async () => {
      const res = await fetch("/api/admin/features");
      if (!res.ok) throw new Error("Failed to load features");
      return (await res.json()) as { catalog: CatalogItem[]; access: Record<string, PlanId> };
    },
  });

  useEffect(() => {
    if (data?.access) setAccess(data.access);
  }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/features", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access }),
      });
      if (!res.ok) throw new Error("Save failed");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Feature access saved — pricing and locks updated");
      setDirty(false);
    },
    onError: () => toast.error("Could not save feature access"),
  });

  const groups = useMemo(() => {
    const by: Record<string, CatalogItem[]> = {};
    for (const c of data?.catalog ?? []) (by[c.group] ??= []).push(c);
    return by;
  }, [data]);

  function setPlan(id: string, plan: PlanId) {
    setAccess((a) => ({ ...a, [id]: plan }));
    setDirty(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Feature access</h1>
          <p className="text-sm text-muted-foreground">
            Set the minimum plan required for each feature and AI tool. Changes drive the
            pricing page and lock the feature for lower plans automatically.
          </p>
        </div>
        <Button onClick={() => save.mutate()} disabled={!dirty || save.isPending}>
          {save.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
          Save changes
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groups).map(([group, items]) => (
            <section key={group} className="rounded-xl border bg-card">
              <div className="flex items-center gap-2 border-b px-4 py-2.5">
                <Sparkles className="size-4 text-primary" />
                <h2 className="text-sm font-semibold">{group}</h2>
                <span className="text-xs text-muted-foreground">{items.length}</span>
              </div>
              <div className="divide-y">
                {items.map((item) => {
                  const current = access[item.id] ?? item.defaultMinPlan;
                  return (
                    <div key={item.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{item.label}</p>
                          {item.kind === "tool" && (
                            <span className="rounded-full border px-1.5 py-0.5 text-[10px] text-muted-foreground">Tool</span>
                          )}
                          {current !== "free" && <Lock className="size-3 text-muted-foreground" />}
                        </div>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1 rounded-lg border bg-background p-1">
                        {PLAN_OPTIONS.map((opt) => {
                          const on = current === opt.id;
                          const Icon = opt.icon;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              data-on={on}
                              onClick={() => setPlan(item.id, opt.id)}
                              className={cn(
                                "flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground",
                                opt.cls,
                              )}
                            >
                              {Icon && <Icon className="size-3" />}
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
