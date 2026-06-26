"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import { Loader2, Mail, Trash2, Users } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { CAREERS } from "@/content/careers";
import { cn } from "@/lib/utils";

interface Application {
  id: string;
  role: string;
  roleTitle: string;
  name: string;
  email: string;
  phone: string;
  link: string;
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

export function CareersManager() {
  const qc = useQueryClient();
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");

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
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-careers"] }),
    onError: () => toast.error("Could not update"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/careers/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin-careers"] }); },
    onError: () => toast.error("Could not delete"),
  });

  const items = data?.items ?? [];
  const counts = data?.counts ?? { total: 0, new: 0, reviewing: 0, shortlisted: 0, rejected: 0 };

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
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="reviewing">Reviewing</SelectItem>
            <SelectItem value="shortlisted">Shortlisted</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed py-16 text-muted-foreground">
          <Users className="size-6" /><p className="text-sm">No applications yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((a) => (
            <div key={a.id} className={cn("rounded-xl border bg-card p-4", a.status === "new" && "border-primary/30")}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold">{a.name}</h3>
                    <span className="rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground">{a.roleTitle}</span>
                    <span className={cn("text-[11px] font-medium capitalize", STATUS_CLS[a.status])}>{a.status}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    <a href={`mailto:${a.email}`} className="text-primary hover:underline">{a.email}</a>
                    {a.phone ? ` · ${a.phone}` : ""}
                    {a.link ? <> · <a href={a.link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{a.link}</a></> : null}
                    {` · ${format(new Date(a.createdAt), "MMM d, yyyy h:mma")}`}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{a.message}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button asChild variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground">
                    <a href={`mailto:${a.email}`}><Mail className="size-4" /></a>
                  </Button>
                  <Select value={a.status} onValueChange={(v) => setStatusM.mutate({ id: a.id, status: v })}>
                    <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="reviewing">Reviewing</SelectItem>
                      <SelectItem value="shortlisted">Shortlisted</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive" onClick={() => remove.mutate(a.id)}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
