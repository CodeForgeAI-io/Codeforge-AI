"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  CheckCircle2, ChevronRight, ExternalLink, Loader2, ShieldAlert, Trash2, Users,
} from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/* ── shared option lists ───────────────────────────────────────────────── */
const BUG_STATUSES = [
  { value: "new", label: "New" },
  { value: "triaged", label: "Triaged" },
  { value: "in_progress", label: "In progress" },
  { value: "fixed", label: "Fixed" },
  { value: "wontfix", label: "Won't fix" },
  { value: "duplicate", label: "Duplicate" },
];
const SEVERITY_CLS: Record<string, string> = {
  low: "text-muted-foreground", medium: "text-blue-500", high: "text-amber-500", critical: "text-red-500",
};
const BUG_STATUS_CLS: Record<string, string> = {
  new: "text-blue-500", triaged: "text-violet-500", in_progress: "text-amber-500",
  fixed: "text-green-500", wontfix: "text-muted-foreground", duplicate: "text-muted-foreground",
};

export function QaManager() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">QA</h1>
        <p className="text-sm text-muted-foreground">Approve contributors and triage reported bugs.</p>
      </div>
      <Tabs defaultValue="bugs">
        <TabsList>
          <TabsTrigger value="bugs">Bugs</TabsTrigger>
          <TabsTrigger value="contributors">Contributors</TabsTrigger>
        </TabsList>
        <TabsContent value="bugs" className="mt-5"><BugsTab /></TabsContent>
        <TabsContent value="contributors" className="mt-5"><ContributorsTab /></TabsContent>
      </Tabs>
    </div>
  );
}

/* ── Contributors ──────────────────────────────────────────────────────── */

interface Contributor {
  id: string; name: string; email: string; motivation: string;
  focusAreas: string[]; experience: string; github: string;
  status: "pending" | "approved" | "rejected"; createdAt: string;
}

function ContributorsTab() {
  const qc = useQueryClient();
  const [status, setStatus] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-qa-contributors", status],
    queryFn: async () => {
      const p = new URLSearchParams();
      if (status !== "all") p.set("status", status);
      const res = await fetch(`/api/admin/qa/contributors?${p}`);
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as { items: Contributor[]; counts: Record<string, number> };
    },
  });

  const setStatusM = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/admin/qa/contributors/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Update failed");
    },
    onSuccess: () => { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["admin-qa-contributors"] }); },
    onError: () => toast.error("Could not update"),
  });

  const items = data?.items ?? [];
  const counts = data?.counts ?? { pending: 0, approved: 0, rejected: 0 };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {counts.pending} pending · {counts.approved} approved · {counts.rejected} rejected
        </p>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-8 w-40 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed py-16 text-muted-foreground">
          <Users className="size-6" /><p className="text-sm">No applications</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((c) => (
            <div key={c.id} className="rounded-xl border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{c.name} <span className="font-normal text-muted-foreground">· {c.email}</span></p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Applied {format(new Date(c.createdAt), "MMM d, yyyy")}
                    {c.focusAreas.length > 0 && <> · {c.focusAreas.join(", ")}</>}
                  </p>
                </div>
                <span className={cn("shrink-0 text-xs font-medium capitalize",
                  c.status === "approved" ? "text-green-500" : c.status === "rejected" ? "text-muted-foreground" : "text-amber-500")}>
                  ● {c.status}
                </span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{c.motivation}</p>
              {c.experience && <p className="mt-2 text-xs text-muted-foreground"><b>Experience:</b> {c.experience}</p>}
              {c.github && (
                <a href={c.github} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline">
                  {c.github} <ExternalLink className="size-3" />
                </a>
              )}
              {c.status !== "approved" && (
                <div className="mt-3 flex gap-2">
                  <Button size="sm" className="gap-1.5" disabled={setStatusM.isPending}
                    onClick={() => setStatusM.mutate({ id: c.id, status: "approved" })}>
                    <CheckCircle2 className="size-4" /> Approve
                  </Button>
                  {c.status !== "rejected" && (
                    <Button size="sm" variant="outline" disabled={setStatusM.isPending}
                      onClick={() => setStatusM.mutate({ id: c.id, status: "rejected" })}>
                      Reject
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Bugs ──────────────────────────────────────────────────────────────── */

interface Bug {
  id: string; title: string; area: string; severity: string; steps: string;
  expected: string; actual: string; environment: string; url: string; screenshotUrl: string;
  status: string; adminNote: string; reporterName: string; createdAt: string;
}

function BugsTab() {
  const qc = useQueryClient();
  const [status, setStatus] = useState("all");
  const [severity, setSeverity] = useState("all");
  const [selected, setSelected] = useState<Bug | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-qa-bugs", status, severity],
    queryFn: async () => {
      const p = new URLSearchParams();
      if (status !== "all") p.set("status", status);
      if (severity !== "all") p.set("severity", severity);
      const res = await fetch(`/api/admin/qa/bugs?${p}`);
      if (!res.ok) throw new Error("Failed");
      return (await res.json()) as { items: Bug[]; counts: Record<string, number> };
    },
  });

  const patch = useMutation({
    mutationFn: async ({ id, body }: { id: string; body: Record<string, unknown> }) => {
      const res = await fetch(`/api/admin/qa/bugs/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Update failed");
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["admin-qa-bugs"] });
      setSelected((s) => (s && s.id === v.id ? { ...s, ...(v.body as Partial<Bug>) } : s));
    },
    onError: () => toast.error("Could not update"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/qa/bugs/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: () => { toast.success("Deleted"); setSelected(null); qc.invalidateQueries({ queryKey: ["admin-qa-bugs"] }); },
    onError: () => toast.error("Could not delete"),
  });

  const items = data?.items ?? [];
  const counts = data?.counts ?? {};

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {(counts.new ?? 0)} new · {(counts.triaged ?? 0)} triaged · {(counts.in_progress ?? 0)} in progress · {(counts.fixed ?? 0)} fixed
        </p>
        <div className="flex gap-2">
          <Select value={severity} onValueChange={setSeverity}>
            <SelectTrigger className="h-8 w-32 text-xs"><SelectValue placeholder="Severity" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All severity</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {BUG_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed py-16 text-muted-foreground">
          <ShieldAlert className="size-6" /><p className="text-sm">No bugs reported</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          {items.map((b, i) => (
            <button key={b.id} onClick={() => setSelected(b)}
              className={cn("flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent", i !== 0 && "border-t")}>
              <ShieldAlert className={cn("size-4 shrink-0", SEVERITY_CLS[b.severity])} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{b.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {b.area} · {b.reporterName} · {format(new Date(b.createdAt), "MMM d")}
                </p>
              </div>
              <span className={cn("shrink-0 text-xs font-medium", BUG_STATUS_CLS[b.status])}>
                {BUG_STATUSES.find((s) => s.value === b.status)?.label ?? b.status}
              </span>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </button>
          ))}
        </div>
      )}

      <Sheet open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-[480px]">
          {selected && (
            <>
              <SheetHeader className="border-b p-5">
                <SheetTitle className="pr-6">{selected.title}</SheetTitle>
                <p className="text-sm text-muted-foreground">
                  <span className={cn("font-medium capitalize", SEVERITY_CLS[selected.severity])}>{selected.severity}</span>
                  {" · "}{selected.area} · {selected.reporterName}
                </p>
              </SheetHeader>
              <div className="space-y-5 p-5">
                <div className="flex items-center gap-2">
                  <Select value={selected.status} onValueChange={(v) => patch.mutate({ id: selected.id, body: { status: v } })}>
                    <SelectTrigger className="h-9 w-44 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>{BUG_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>

                <Section label="Steps to reproduce">{selected.steps}</Section>
                {selected.expected && <Section label="Expected">{selected.expected}</Section>}
                {selected.actual && <Section label="Actual">{selected.actual}</Section>}
                {selected.environment && <Section label="Environment">{selected.environment}</Section>}
                {selected.url && (
                  <Section label="URL">
                    <a href={selected.url} target="_blank" rel="noopener noreferrer" className="break-all text-primary hover:underline">{selected.url}</a>
                  </Section>
                )}
                {selected.screenshotUrl && (
                  <Section label="Screenshot">
                    <a href={selected.screenshotUrl} target="_blank" rel="noopener noreferrer" className="break-all text-primary hover:underline">{selected.screenshotUrl}</a>
                  </Section>
                )}

                <div className="space-y-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Admin note</p>
                  <Textarea
                    defaultValue={selected.adminNote} rows={3} placeholder="Internal note…"
                    onBlur={(e) => { if (e.target.value !== selected.adminNote) patch.mutate({ id: selected.id, body: { adminNote: e.target.value } }); }}
                  />
                </div>

                <Button variant="outline" className="w-full gap-2 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => remove.mutate(selected.id)}>
                  <Trash2 className="size-4" /> Delete report
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="whitespace-pre-wrap text-sm text-muted-foreground">{children}</p>
    </div>
  );
}
