"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import { ChevronRight, FileText, Loader2, Mail, Trash2, Users } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { CAREERS } from "@/content/careers";
import { cn } from "@/lib/utils";

interface Application {
  id: string;
  role: string;
  roleTitle: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  portfolio: string;
  experience: string;
  company: string;
  resumeUrl: string;
  resumeName: string;
  message: string;
  status: "new" | "reviewing" | "shortlisted" | "rejected";
  createdAt: string;
}

const STATUS_CLS: Record<string, string> = {
  new: "text-blue-500",
  reviewing: "text-amber-500",
  shortlisted: "text-green-500",
  rejected: "text-muted-foreground",
};

const STATUS_OPTIONS = (
  <>
    <SelectItem value="new">New</SelectItem>
    <SelectItem value="reviewing">Reviewing</SelectItem>
    <SelectItem value="shortlisted">Shortlisted</SelectItem>
    <SelectItem value="rejected">Rejected</SelectItem>
  </>
);

export function CareersManager() {
  const qc = useQueryClient();
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState<Application | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-careers", role, status],
    queryFn: async () => {
      const p = new URLSearchParams();
      if (role !== "all") p.set("role", role);
      if (status !== "all") p.set("status", status);
      const res = await fetch(`/api/admin/careers?${p}`);
      if (!res.ok) throw new Error("Failed to load applications");
      return (await res.json()) as { items: Application[]; counts: Record<string, number> };
    },
  });

  const setStatusM = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/admin/careers/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Update failed");
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["admin-careers"] });
      setSelected((s) => (s && s.id === v.id ? { ...s, status: v.status as Application["status"] } : s));
    },
    onError: () => toast.error("Could not update"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/careers/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: () => { toast.success("Deleted"); setSelected(null); qc.invalidateQueries({ queryKey: ["admin-careers"] }); },
    onError: () => toast.error("Could not delete"),
  });

  const items = data?.items ?? [];
  const counts = data?.counts ?? { new: 0, reviewing: 0, shortlisted: 0, rejected: 0 };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Job applications</h1>
        <p className="text-sm text-muted-foreground">
          {counts.new} new · {counts.reviewing} reviewing · {counts.shortlisted} shortlisted · {counts.rejected} rejected
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger className="h-8 w-56 text-xs"><SelectValue placeholder="All roles" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            {CAREERS.map((c) => <SelectItem key={c.slug} value={c.slug}>{c.title}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-8 w-40 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All statuses</SelectItem>{STATUS_OPTIONS}</SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed py-16 text-muted-foreground">
          <Users className="size-6" /><p className="text-sm">No applications yet</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          {items.map((a, i) => (
            <button
              key={a.id}
              onClick={() => setSelected(a)}
              className={cn("flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent", i !== 0 && "border-t")}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium">{a.name}</span>
                  <span className={cn("text-[11px] font-medium capitalize", STATUS_CLS[a.status])}>● {a.status}</span>
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {a.roleTitle} · {a.location || a.email} · {format(new Date(a.createdAt), "MMM d, yyyy")}
                </p>
              </div>
              {a.resumeUrl && <FileText className="size-4 shrink-0 text-muted-foreground" />}
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </button>
          ))}
        </div>
      )}

      {/* detail sheet */}
      <Sheet open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-[460px]">
          {selected && (
            <>
              <SheetHeader className="border-b p-5">
                <SheetTitle>{selected.name}</SheetTitle>
                <p className="text-sm text-muted-foreground">{selected.roleTitle}</p>
              </SheetHeader>
              <div className="space-y-5 p-5">
                <div className="flex items-center gap-2">
                  <Select value={selected.status} onValueChange={(v) => setStatusM.mutate({ id: selected.id, status: v })}>
                    <SelectTrigger className="h-9 w-40 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUS_OPTIONS}</SelectContent>
                  </Select>
                  <Button asChild variant="outline" size="sm" className="gap-1.5">
                    <a href={`mailto:${selected.email}`}><Mail className="size-4" /> Email</a>
                  </Button>
                </div>

                {selected.resumeUrl && (
                  <a href={`/api/admin/careers/${selected.id}/resume`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2.5 rounded-lg border bg-background px-3 py-2.5 text-sm font-medium text-primary hover:bg-accent">
                    <FileText className="size-4" /> {selected.resumeName || "Download résumé"}
                  </a>
                )}

                <dl className="space-y-3 text-sm">
                  <Row label="Email"><a href={`mailto:${selected.email}`} className="text-primary hover:underline">{selected.email}</a></Row>
                  <Row label="Phone">{selected.phone || "—"}</Row>
                  <Row label="Location">{selected.location || "—"}</Row>
                  <Row label="Experience">{selected.experience || "—"}</Row>
                  {selected.company && <Row label="Company">{selected.company}</Row>}
                  {selected.linkedin && <Row label="LinkedIn"><Ext url={selected.linkedin} /></Row>}
                  {selected.github && <Row label="GitHub"><Ext url={selected.github} /></Row>}
                  {selected.portfolio && <Row label="Portfolio"><Ext url={selected.portfolio} /></Row>}
                  <Row label="Applied">{format(new Date(selected.createdAt), "MMM d, yyyy h:mma")}</Row>
                </dl>

                {selected.message && (
                  <div>
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Note</p>
                    <p className="whitespace-pre-wrap rounded-lg border bg-background p-3 text-sm text-muted-foreground">{selected.message}</p>
                  </div>
                )}

                <Button variant="outline" className="w-full gap-2 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => remove.mutate(selected.id)}>
                  <Trash2 className="size-4" /> Delete application
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <dt className="w-24 shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 flex-1 break-words font-medium">{children}</dd>
    </div>
  );
}

function Ext({ url }: { url: string }) {
  return <a href={url} target="_blank" rel="noopener noreferrer" className="break-all text-primary hover:underline">{url}</a>;
}
