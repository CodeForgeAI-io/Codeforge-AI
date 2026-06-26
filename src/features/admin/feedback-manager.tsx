"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import { Loader2, MessageSquare, Trash2 } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface FeedbackItem {
  id: string;
  type: "feature" | "bug" | "issue";
  title: string;
  description: string;
  email: string;
  user: { name: string; username: string } | null;
  status: "new" | "read" | "resolved";
  createdAt: string;
}

const TYPE_META = {
  feature: { label: "Feature", cls: "bg-blue-500/10 text-blue-500 border-blue-500/30" },
  bug: { label: "Bug", cls: "bg-red-500/10 text-red-500 border-red-500/30" },
  issue: { label: "Issue", cls: "bg-amber-500/10 text-amber-500 border-amber-500/30" },
} as const;

const STATUS_FILTERS = ["all", "new", "read", "resolved"] as const;

export function FeedbackManager() {
  const qc = useQueryClient();
  const [status, setStatus] = useState<string>("all");
  const [type, setType] = useState<string>("all");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-feedback", status, type],
    queryFn: async () => {
      const p = new URLSearchParams();
      if (status !== "all") p.set("status", status);
      if (type !== "all") p.set("type", type);
      const res = await fetch(`/api/admin/feedback?${p}`);
      if (!res.ok) throw new Error("Failed to load feedback");
      return (await res.json()) as { items: FeedbackItem[]; counts: Record<string, number> };
    },
  });

  const setStatusM = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/admin/feedback/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Update failed");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-feedback"] }),
    onError: () => toast.error("Could not update"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/feedback/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin-feedback"] }); },
    onError: () => toast.error("Could not delete"),
  });

  const items = data?.items ?? [];
  const counts = data?.counts ?? { new: 0, read: 0, resolved: 0 };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Feedback</h1>
        <p className="text-sm text-muted-foreground">
          {counts.new} new · {counts.read} read · {counts.resolved} resolved
        </p>
      </div>

      {/* filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1 rounded-lg border bg-muted/40 p-1">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors",
                status === s ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {s}
            </button>
          ))}
        </div>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="feature">Feature</SelectItem>
            <SelectItem value="bug">Bug</SelectItem>
            <SelectItem value="issue">Issue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* list */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed py-16 text-muted-foreground">
          <MessageSquare className="size-6" /><p className="text-sm">No feedback yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((f) => {
            const meta = TYPE_META[f.type];
            return (
              <div key={f.id} className={cn("rounded-xl border bg-card p-4", f.status === "new" && "border-primary/30")}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-semibold", meta.cls)}>{meta.label}</span>
                      <h3 className="text-sm font-semibold">{f.title}</h3>
                    </div>
                    <p className="mt-1.5 whitespace-pre-wrap text-sm text-muted-foreground">{f.description}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {f.user ? `${f.user.name} (@${f.user.username})` : "Anonymous"}
                      {f.email ? ` · ` : ""}
                      {f.email && <a href={`mailto:${f.email}`} className="text-primary hover:underline">{f.email}</a>}
                      {` · ${format(new Date(f.createdAt), "MMM d, yyyy h:mma")}`}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Select value={f.status} onValueChange={(v) => setStatusM.mutate({ id: f.id, status: v })}>
                      <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="read">Read</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive" onClick={() => remove.mutate(f.id)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
