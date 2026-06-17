"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  Crown,
  Flame,
  Loader2,
  Search,
  Shield,
  ShieldOff,
  Sparkles,
  Trophy,
  UserCheck,
  UserX,
  Zap,
} from "lucide-react";
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
import { Label } from "@/components/ui/label";
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
  free:  { label: "Free",  color: "text-muted-foreground", bg: "bg-muted/50 border-border",              icon: null },
  go:    { label: "Go",    color: "text-orange-400",       bg: "bg-orange-500/10 border-orange-500/30",  icon: Zap },
  plus:  { label: "Plus",  color: "text-yellow-400",       bg: "bg-yellow-500/10 border-yellow-500/30",  icon: Crown },
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

function StatPill({ label, value, className }: { label: string; value: string | number; className?: string }) {
  return (
    <div className={cn("rounded-lg border bg-muted/30 p-2.5 text-center", className)}>
      <p className="text-base font-bold">{value}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

function UserDetailSheet({
  user,
  open,
  onClose,
  onPatch,
}: {
  user: AdminUser;
  open: boolean;
  onClose: () => void;
  onPatch: (patch: Record<string, unknown>) => void;
}) {
  const now = Date.now();
  const isOnTrial = !!user.trialEndsAt && new Date(user.trialEndsAt).getTime() > now;
  const planExpiry = user.planExpiresAt ? new Date(user.planExpiresAt) : null;
  const trialExpiry = user.trialEndsAt ? new Date(user.trialEndsAt) : null;

  function grantGoPlan30Days() {
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    onPatch({ plan: "go", planExpiresAt: expires, betaUser: true });
  }

  function revokePlan() {
    onPatch({ plan: "free", planExpiresAt: null, billingCycle: null });
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md" side="right">
        <SheetHeader className="mb-4">
          <SheetTitle className="text-base">User Details</SheetTitle>
        </SheetHeader>

        {/* Profile */}
        <div className="mb-5 flex items-center gap-3">
          <Avatar className="size-14 shrink-0">
            <AvatarImage src={user.image ?? undefined} alt={user.name} />
            <AvatarFallback className="text-sm font-bold">
              {user.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate font-bold">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">@{user.username}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>

        <div className="mb-5 flex flex-wrap gap-1.5">
          {user.providers.map((p) => (
            <Badge key={p} variant="outline" className="text-[10px]">{p}</Badge>
          ))}
          <Badge variant={user.role === "admin" ? "default" : "outline"} className="text-[10px]">
            {user.role}
          </Badge>
          {user.banned && <Badge variant="destructive" className="text-[10px]">Banned</Badge>}
          <span className="text-xs text-muted-foreground self-center">
            Joined {format(new Date(user.createdAt), "MMM d, yyyy")}
          </span>
        </div>

        <Separator className="mb-5" />

        {/* Subscription */}
        <section className="mb-5 space-y-3">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold">
            <Crown className="size-3.5 text-muted-foreground" /> Subscription
          </h3>

          <div className="rounded-xl border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <PlanBadge plan={user.plan} betaUser={user.betaUser} />
              {user.billingCycle && (
                <span className="text-xs text-muted-foreground capitalize">{user.billingCycle}</span>
              )}
            </div>

            {planExpiry && (
              <div className="text-xs text-muted-foreground">
                {user.billingCycle ? "Renews" : "Expires"}{" "}
                <span className="font-medium text-foreground">
                  {format(planExpiry, "MMM d, yyyy")}
                </span>
                {" · "}
                {formatDistanceToNow(planExpiry, { addSuffix: true })}
              </div>
            )}

            {isOnTrial && trialExpiry && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs">
                <span className="font-semibold text-primary">On trial</span>
                <span className="text-muted-foreground"> · expires {format(trialExpiry, "MMM d, yyyy")}</span>
              </div>
            )}

            {user.betaUser && (
              <div className="flex items-center gap-1.5 text-xs text-purple-400">
                <Sparkles className="size-3" /> Beta user
              </div>
            )}
          </div>

          {/* Plan controls */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Change plan</Label>
            </div>
            <Select value={user.plan} onValueChange={(plan) => onPatch({ plan })}>
              <SelectTrigger className="h-8 text-xs">
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
                className="h-8 text-xs border-orange-500/40 text-orange-400 hover:bg-orange-500/10"
                onClick={grantGoPlan30Days}
              >
                <Zap className="size-3 mr-1" /> Grant Go · 30d
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs"
                onClick={revokePlan}
                disabled={user.plan === "free"}
              >
                Revoke plan
              </Button>
            </div>

            <div className="flex items-center justify-between rounded-lg border px-3 py-2">
              <span className="text-xs font-medium">Beta user</span>
              <Switch
                checked={user.betaUser}
                onCheckedChange={(betaUser) => onPatch({ betaUser })}
              />
            </div>
          </div>
        </section>

        <Separator className="mb-5" />

        {/* Stats */}
        <section className="mb-5 space-y-3">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold">
            <Trophy className="size-3.5 text-muted-foreground" /> Stats
          </h3>

          <div className="grid grid-cols-3 gap-2">
            <StatPill label="XP" value={user.xp.toLocaleString()} />
            <StatPill label="Level" value={user.level} />
            <StatPill label="Solved" value={user.solved} />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <StatPill label="Easy" value={user.solvedBreakdown.easy} className="border-green-500/20 text-green-400" />
            <StatPill label="Medium" value={user.solvedBreakdown.medium} className="border-yellow-500/20 text-yellow-400" />
            <StatPill label="Hard" value={user.solvedBreakdown.hard} className="border-red-500/20 text-red-400" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2.5">
              <Flame className="size-4 text-orange-500 shrink-0" />
              <div>
                <p className="text-sm font-bold">{user.streak}</p>
                <p className="text-[10px] text-muted-foreground">Current streak</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2.5">
              <Flame className="size-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-sm font-bold">{user.longestStreak}</p>
                <p className="text-[10px] text-muted-foreground">Longest streak</p>
              </div>
            </div>
          </div>
        </section>

        <Separator className="mb-5" />

        {/* Account actions */}
        <section className="space-y-2">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold mb-3">
            <Shield className="size-3.5 text-muted-foreground" /> Account
          </h3>

          <div className="grid grid-cols-2 gap-2">
            <Select value={user.role} onValueChange={(role) => onPatch({ role })}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>

            <Button
              size="sm"
              variant={user.banned ? "outline" : "destructive"}
              className="h-8 text-xs gap-1.5"
              onClick={() => onPatch({ banned: !user.banned })}
            >
              {user.banned
                ? <><UserCheck className="size-3" /> Unban</>
                : <><UserX className="size-3" /> Ban</>}
            </Button>
          </div>
        </section>
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

  function patch(id: string, p: Record<string, unknown>) {
    patchUser.mutate({ id, patch: p });
    // Optimistically update selected user in drawer
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
              <span className="flex items-center gap-1 text-orange-400">
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
                        <Flame className="size-3.5 text-orange-500" />
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
                      onValueChange={(role) => { patch(user.id, { role }); }}
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
        />
      )}
    </div>
  );
}
