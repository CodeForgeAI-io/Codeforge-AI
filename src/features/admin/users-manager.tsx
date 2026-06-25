"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  CalendarDays,
  Crown,
  Flame,
  Loader2,
  Search,
  Shield,
  Sparkles,
  Trash2,
  Trophy,
  UserCheck,
  UserX,
  Zap,
} from "@/components/icons";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface AdminUser {
  id: string;
  name: string;
  username: string;
  email: string;
  image: string | null;
  role: "user" | "admin";
  banned: boolean;
  xp: number;
  level: number;
  solved: number;
  solvedBreakdown: { easy: number; medium: number; hard: number };
  streak: number;
  longestStreak: number;
  providers: string[];
  plan: "free" | "go" | "plus";
  planExpiresAt: string | null;
  trialEndsAt: string | null;
  billingCycle: "monthly" | "yearly" | null;
  betaUser: boolean;
  createdAt: string;
}

const PLAN_META = {
  free: { label: "Free", color: "text-muted-foreground", bg: "bg-muted/50 border-border", icon: null },
  go:   { label: "Go",   color: "text-blue-400",      bg: "bg-blue-500/10 border-blue-500/30", icon: Zap },
  plus: { label: "Plus", color: "text-yellow-400",      bg: "bg-yellow-500/10 border-yellow-500/30", icon: Crown },
} as const;

function PlanBadge({ plan, betaUser }: { plan: string; betaUser: boolean }) {
  const meta = PLAN_META[plan as keyof typeof PLAN_META] ?? PLAN_META.free;
  const Icon = meta.icon;
  return (
    <div className="flex items-center gap-1.5">
      <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold", meta.bg, meta.color)}>
        {Icon && <Icon className="size-2.5" />}
        {meta.label}
      </span>
      {betaUser && (
        <span className="inline-flex items-center gap-0.5 rounded-full border border-purple-500/30 bg-purple-500/10 px-1.5 py-0.5 text-[10px] font-bold text-purple-400">
          <Sparkles className="size-2.5" /> Beta
        </span>
      )}
    </div>
  );
}

function SubscriptionStatus({ user }: { user: AdminUser }) {
  const now = Date.now();
  const isOnTrial = !!user.trialEndsAt && new Date(user.trialEndsAt).getTime() > now;
  const isExpired = !!user.planExpiresAt && new Date(user.planExpiresAt).getTime() < now && user.plan !== "free";

  if (isOnTrial) {
    const daysLeft = Math.ceil((new Date(user.trialEndsAt!).getTime() - now) / 86400000);
    return <span className="text-[11px] text-primary font-medium">Trial · {daysLeft}d left</span>;
  }
  if (user.betaUser && user.plan !== "free") {
    return <span className="text-[11px] text-purple-400 font-medium">Beta access</span>;
  }
  if (isExpired) {
    return <span className="text-[11px] text-destructive font-medium">Expired</span>;
  }
  if (user.planExpiresAt && user.plan !== "free") {
    return (
      <span className="text-[11px] text-muted-foreground">
        {user.billingCycle ? "Renews" : "Until"} {format(new Date(user.planExpiresAt), "MMM d, yy")}
      </span>
    );
  }
  return null;
}

/* ── Shared layout helpers ── */
function SectionHeading({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 pb-2">
      <Icon className="size-3.5 text-muted-foreground" />
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{children}</span>
    </div>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 border-b border-border/50 last:border-0">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span className="text-xs font-medium text-right">{children}</span>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border bg-muted/20 py-3 px-2 gap-0.5">
      <span className={cn("text-lg font-black tabular-nums leading-none", accent ?? "text-foreground")}>{value}</span>
      <span className="text-[10px] text-muted-foreground mt-1">{label}</span>
    </div>
  );
}

function UserDetailSheet({
  user,
  open,
  onClose,
  onPatch,
  onDelete,
  deleting,
}: {
  user: AdminUser;
  open: boolean;
  onClose: () => void;
  onPatch: (patch: Record<string, unknown>) => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const now = Date.now();
  const isOnTrial = !!user.trialEndsAt && new Date(user.trialEndsAt).getTime() > now;
  const isExpired = !!user.planExpiresAt && new Date(user.planExpiresAt).getTime() < now && user.plan !== "free";
  const planExpiry = user.planExpiresAt ? new Date(user.planExpiresAt) : null;
  const trialExpiry = user.trialEndsAt ? new Date(user.trialEndsAt) : null;
  const meta = PLAN_META[user.plan] ?? PLAN_META.free;
  const PlanIcon = meta.icon;

  function grantGoPlan30Days() {
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    onPatch({ plan: "go", planExpiresAt: expires, betaUser: true });
  }

  function revokePlan() {
    onPatch({ plan: "free", planExpiresAt: null, billingCycle: null });
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="flex w-full flex-col overflow-y-auto p-0 sm:max-w-[420px]" side="right">

        {/* ── Header ── */}
        <div className="border-b bg-muted/20 px-5 py-5">
          <SheetHeader className="mb-4 text-left">
            <SheetTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              User Details
            </SheetTitle>
          </SheetHeader>

          <div className="flex items-center gap-4">
            <Avatar className="size-16 shrink-0 ring-2 ring-border">
              <AvatarImage src={user.image ?? undefined} alt={user.name} />
              <AvatarFallback className="text-base font-black">
                {user.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-bold leading-tight">{user.name}</p>
              <p className="truncate text-sm text-muted-foreground">@{user.username}</p>
              <p className="truncate text-xs text-muted-foreground mt-0.5">{user.email}</p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {user.providers.map((p) => (
              <Badge key={p} variant="outline" className="text-[10px] capitalize">{p}</Badge>
            ))}
            <Badge
              variant={user.role === "admin" ? "default" : "secondary"}
              className="text-[10px] capitalize"
            >
              {user.role}
            </Badge>
            {user.banned && (
              <Badge variant="destructive" className="text-[10px]">Banned</Badge>
            )}
            {user.betaUser && (
              <span className="inline-flex items-center gap-0.5 rounded-full border border-purple-500/30 bg-purple-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-purple-400">
                <Sparkles className="size-2.5" /> Beta
              </span>
            )}
          </div>

          <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarDays className="size-3.5" />
            Joined {format(new Date(user.createdAt), "MMMM d, yyyy")}
          </div>
        </div>

        <div className="flex-1 space-y-0 divide-y divide-border/60">

          {/* ── Subscription ── */}
          <section className="px-5 py-5 space-y-4">
            <SectionHeading icon={Crown}>Subscription</SectionHeading>

            {/* Plan status card */}
            <div className={cn("flex items-center justify-between rounded-xl border px-4 py-3.5", meta.bg)}>
              <div className="flex items-center gap-2.5">
                <div className={cn("flex size-9 items-center justify-center rounded-lg border", meta.bg)}>
                  {PlanIcon
                    ? <PlanIcon className={cn("size-4", meta.color)} />
                    : <span className={cn("text-xs font-black", meta.color)}>F</span>
                  }
                </div>
                <div>
                  <p className={cn("text-sm font-bold", meta.color)}>{meta.label} Plan</p>
                  <p className="text-xs text-muted-foreground">
                    {user.billingCycle ? `Billed ${user.billingCycle}` : user.betaUser && user.plan !== "free" ? "Beta access" : "No billing"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                {isExpired && (
                  <span className="inline-flex items-center rounded-full bg-destructive/10 border border-destructive/30 px-2 py-0.5 text-[10px] font-bold text-destructive">Expired</span>
                )}
                {isOnTrial && (
                  <span className="inline-flex items-center rounded-full bg-primary/10 border border-primary/30 px-2 py-0.5 text-[10px] font-bold text-primary">Trial</span>
                )}
                {!isExpired && !isOnTrial && user.plan !== "free" && (
                  <span className="inline-flex items-center rounded-full bg-green-500/10 border border-green-500/30 px-2 py-0.5 text-[10px] font-bold text-green-400">Active</span>
                )}
              </div>
            </div>

            {/* Key-value rows */}
            <div className="rounded-xl border divide-y divide-border/50 overflow-hidden">
              {planExpiry && (
                <InfoRow label={user.billingCycle ? "Renews" : "Expires"}>
                  <span className="flex flex-col items-end gap-0.5">
                    <span>{format(planExpiry, "MMM d, yyyy")}</span>
                    <span className="text-[10px] font-normal text-muted-foreground">
                      {formatDistanceToNow(planExpiry, { addSuffix: true })}
                    </span>
                  </span>
                </InfoRow>
              )}
              {isOnTrial && trialExpiry && (
                <InfoRow label="Trial ends">
                  {format(trialExpiry, "MMM d, yyyy")}
                </InfoRow>
              )}
              <InfoRow label="Beta user">
                <Switch
                  checked={user.betaUser}
                  onCheckedChange={(betaUser) => onPatch({ betaUser })}
                />
              </InfoRow>
            </div>

            {/* Plan actions */}
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Change plan</p>
              <Select value={user.plan} onValueChange={(plan) => onPatch({ plan })}>
                <SelectTrigger className="h-9 w-full text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="go">Go</SelectItem>
                  <SelectItem value="plus">Plus</SelectItem>
                </SelectContent>
              </Select>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 w-full gap-1.5 border-blue-500/40 text-blue-400 hover:bg-blue-500/10 text-xs font-semibold"
                  onClick={grantGoPlan30Days}
                >
                  <Zap className="size-3.5" /> Grant Go · 30d
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 w-full text-xs font-semibold"
                  onClick={revokePlan}
                  disabled={user.plan === "free"}
                >
                  Revoke plan
                </Button>
              </div>
            </div>
          </section>

          {/* ── Stats ── */}
          <section className="px-5 py-5 space-y-4">
            <SectionHeading icon={Trophy}>Stats</SectionHeading>

            <div className="grid grid-cols-3 gap-2">
              <StatCard label="XP" value={user.xp >= 1000 ? `${(user.xp / 1000).toFixed(1)}k` : user.xp} />
              <StatCard label="Level" value={user.level} />
              <StatCard label="Solved" value={user.solved} />
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Solved breakdown</p>
              <div className="grid grid-cols-3 gap-2">
                <StatCard label="Easy" value={user.solvedBreakdown.easy} accent="text-green-400" />
                <StatCard label="Medium" value={user.solvedBreakdown.medium} accent="text-yellow-400" />
                <StatCard label="Hard" value={user.solvedBreakdown.hard} accent="text-red-400" />
              </div>
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Streak</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-3 rounded-xl border bg-muted/20 px-3.5 py-3">
                  <Flame className="size-5 text-amber-500 shrink-0" />
                  <div>
                    <p className="text-lg font-black leading-none">{user.streak}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Current</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl border bg-muted/20 px-3.5 py-3">
                  <Flame className="size-5 text-muted-foreground/50 shrink-0" />
                  <div>
                    <p className="text-lg font-black leading-none">{user.longestStreak}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Longest</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── Account ── */}
          <section className="px-5 py-5 space-y-4">
            <SectionHeading icon={Shield}>Account</SectionHeading>

            <div className="rounded-xl border divide-y divide-border/50 overflow-hidden">
              <InfoRow label="User ID">
                <span className="font-mono text-[10px] text-muted-foreground">{user.id.slice(-8)}</span>
              </InfoRow>
              <InfoRow label="Providers">
                <div className="flex gap-1 flex-wrap justify-end">
                  {user.providers.map((p) => (
                    <Badge key={p} variant="outline" className="text-[10px] capitalize">{p}</Badge>
                  ))}
                </div>
              </InfoRow>
              <InfoRow label="Joined">
                {format(new Date(user.createdAt), "MMM d, yyyy")}
              </InfoRow>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Role</p>
              <Select value={user.role} onValueChange={(role) => onPatch({ role })}>
                <SelectTrigger className="h-9 w-full text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              variant={user.banned ? "outline" : "destructive"}
              className="w-full h-9 gap-2 text-sm font-semibold"
              onClick={() => onPatch({ banned: !user.banned })}
            >
              {user.banned
                ? <><UserCheck className="size-4" /> Unban User</>
                : <><UserX className="size-4" /> Ban User</>
              }
            </Button>
          </section>

          {/* Danger zone */}
          <section className="space-y-3 border-t pt-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-destructive">Danger zone</h3>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="h-9 w-full gap-2 border-destructive/40 text-sm font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="size-4" /> Delete User
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete {user.name}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This permanently removes <strong>{user.email}</strong> and all their data —
                    submissions, notes, bookmarks, subscriptions and progress. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={(e) => { e.preventDefault(); onDelete(); }}
                    className="bg-destructive text-white hover:bg-destructive/90"
                  >
                    {deleting ? <Loader2 className="size-4 animate-spin" /> : "Delete user"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </section>

        </div>
      </SheetContent>
    </Sheet>
  );
}

export function UsersManager() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [selected, setSelected] = useState<AdminUser | null>(null);

  const { data, isLoading } = useQuery<{ users: AdminUser[] }>({
    queryKey: ["admin-users", search, planFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (planFilter !== "all") params.set("plan", planFilter);
      const res = await fetch(`/api/admin/users?${params}`);
      if (!res.ok) throw new Error("Failed to load users");
      return res.json();
    },
  });

  const patchUser = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Record<string, unknown> }) => {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error ?? "Update failed");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteUser = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error ?? "Delete failed");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setSelected(null);
      toast.success("User deleted");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  function patch(id: string, p: Record<string, unknown>) {
    patchUser.mutate({ id, patch: p });
    if (selected?.id === id) {
      setSelected((prev) => prev ? { ...prev, ...p } as AdminUser : prev);
    }
  }

  const users = data?.users ?? [];
  const betaCount = users.filter((u) => u.betaUser).length;
  const paidCount = users.filter((u) => u.plan !== "free").length;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email or username…"
            className="h-9 pl-8"
          />
        </div>
        <Select value={planFilter} onValueChange={setPlanFilter}>
          <SelectTrigger className="h-9 w-36">
            <SelectValue placeholder="All plans" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All plans</SelectItem>
            <SelectItem value="free">Free</SelectItem>
            <SelectItem value="go">Go</SelectItem>
            <SelectItem value="plus">Plus</SelectItem>
            <SelectItem value="beta">Beta</SelectItem>
          </SelectContent>
        </Select>

        {!isLoading && (
          <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
            <span>{users.length} users</span>
            {paidCount > 0 && (
              <span className="flex items-center gap-1 text-blue-400">
                <Zap className="size-3" /> {paidCount} paid
              </span>
            )}
            {betaCount > 0 && (
              <span className="flex items-center gap-1 text-purple-400">
                <Sparkles className="size-3" /> {betaCount} beta
              </span>
            )}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : !users.length ? (
        <p className="py-16 text-center text-sm text-muted-foreground">No users found.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>XP / Lvl</TableHead>
                <TableHead>Solved</TableHead>
                <TableHead>Streak</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Banned</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow
                  key={user.id}
                  className={cn(
                    "cursor-pointer transition-colors hover:bg-muted/40",
                    user.banned && "opacity-60",
                    selected?.id === user.id && "bg-muted/40",
                  )}
                  onClick={() => setSelected(user)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Avatar className="size-8 shrink-0">
                        <AvatarImage src={user.image ?? undefined} alt={user.name} />
                        <AvatarFallback className="text-xs">
                          {user.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{user.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-0.5">
                      <PlanBadge plan={user.plan} betaUser={user.betaUser} />
                      <SubscriptionStatus user={user} />
                    </div>
                  </TableCell>

                  <TableCell>
                    <div>
                      <p className="text-sm font-medium">{user.xp.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Lv {user.level}</p>
                    </div>
                  </TableCell>

                  <TableCell className="text-muted-foreground">{user.solved}</TableCell>

                  <TableCell>
                    {user.streak > 0 ? (
                      <span className="flex items-center gap-1 text-sm">
                        <Flame className="size-3.5 text-amber-500" />
                        {user.streak}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>

                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {format(new Date(user.createdAt), "MMM d, yyyy")}
                  </TableCell>

                  <TableCell>
                    <Select
                      value={user.role}
                      onValueChange={(role) => patch(user.id, { role })}
                    >
                      <SelectTrigger size="sm" className="w-24" onClick={(e) => e.stopPropagation()}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>

                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Switch
                      checked={user.banned}
                      onCheckedChange={(banned) => patch(user.id, { banned })}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {selected && (
        <UserDetailSheet
          user={selected}
          open={!!selected}
          onClose={() => setSelected(null)}
          onPatch={(p) => patch(selected.id, p)}
          onDelete={() => deleteUser.mutate(selected.id)}
          deleting={deleteUser.isPending}
        />
      )}
    </div>
  );
}
