"use client";

import { useState } from "react";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import {
  Award,
  CheckCircle2,
  ExternalLink,
  Flame,
  Globe,
  MapPin,
  Medal,
  Paintbrush,
  Settings,
  Target,
  TrendingUp,
  Trophy,
  Zap,
} from "@/components/icons";

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49 0-.24-.01-.88-.01-1.73-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.34 1.12 2.91.86.09-.67.35-1.12.63-1.38-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.7 0 0 .84-.28 2.75 1.05a9.36 9.36 0 0 1 5 0c1.91-1.33 2.75-1.05 2.75-1.05.55 1.4.2 2.44.1 2.7.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.8-4.57 5.06.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.6.69.49A10.04 10.04 0 0 0 22 12.25C22 6.58 17.52 2 12 2" />
    </svg>
  );
}

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { DashboardData } from "@/services/stats";
import { ActivityHeatmap } from "@/features/dashboard/heatmap";
import { FollowButton } from "./follow-button";
import { ShareButton } from "./share-button";

const TIER_STYLES: Record<string, string> = {
  bronze: "border-amber-400/40 bg-amber-400/10 text-amber-600 dark:text-amber-300",
  silver: "border-slate-400/40 bg-slate-400/10 text-slate-600 dark:text-slate-300",
  gold: "border-yellow-500/50 bg-yellow-400/10 text-yellow-600 dark:text-yellow-300",
};

const TABS = ["Overview", "Badges", "Activity"] as const;
type Tab = (typeof TABS)[number];

function LevelRing({ level, percent }: { level: number; percent: number }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = circ * Math.min(Math.max(percent, 0), 100) / 100;
  return (
    <div className="relative size-16 shrink-0">
      <svg viewBox="0 0 64 64" className="size-full -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" strokeWidth="5" className="stroke-muted" />
        <circle cx="32" cy="32" r={r} fill="none" strokeWidth="5" strokeLinecap="round" className="stroke-[#006bff]"
          strokeDasharray={`${dash} ${circ - dash}`} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[8px] font-semibold uppercase tracking-wide text-muted-foreground">Lvl</span>
        <span className="text-lg font-bold leading-none">{level}</span>
      </div>
    </div>
  );
}

function StatPill({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 px-4 py-3 text-center">
      <span className={cn("text-xl font-black", color ?? "text-foreground")}>{value}</span>
      <span className="text-[11px] text-muted-foreground">{label}</span>
    </div>
  );
}

interface Props {
  data: DashboardData;
  isOwner: boolean;
  signedIn: boolean;
  viewerUserId?: string;
  isFollowing?: boolean;
  targetUserId?: string;
}

export function PublicProfile({ data, isOwner, signedIn, isFollowing = false, targetUserId }: Props) {
  const [tab, setTab] = useState<Tab>("Overview");

  const initials = data.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  const levelPercent = Math.round((data.xpIntoLevel / Math.max(data.xpForNextLevel, 1)) * 100);
  const solvedPercent = data.totalQuestions.total > 0
    ? Math.round((data.solved.total / data.totalQuestions.total) * 100)
    : 0;

  return (
    <div className="space-y-5">
      {/* ── hero ── */}
      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        {/* cover */}
        <div className="relative h-28 bg-linear-to-br from-[#006bff]/30 via-[#006bff]/10 to-transparent sm:h-36">
          <div className="absolute -right-10 -top-10 size-40 rounded-full bg-[#006bff]/20 blur-3xl" />
        </div>

        <div className="relative px-5 pb-5">
          {/* avatar overlaps cover */}
          <div className="-mt-10 mb-3 flex items-end justify-between sm:-mt-12">
            <Avatar className="size-20 border-4 border-background shadow-md sm:size-24">
              <AvatarImage src={data.image ?? undefined} alt={data.name} />
              <AvatarFallback className="bg-primary/10 text-2xl font-bold text-primary">{initials}</AvatarFallback>
            </Avatar>

            {/* actions */}
            <div className="mb-1 flex items-center gap-2">
              <ShareButton username={data.username} />
              {isOwner ? (
                <Button asChild size="sm" variant="outline">
                  <Link href="/settings"><Settings className="size-3.5" /> Edit profile</Link>
                </Button>
              ) : signedIn && targetUserId ? (
                <FollowButton userId={targetUserId} initialFollowing={isFollowing} />
              ) : null}
            </div>
          </div>

          {/* identity */}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold">{data.name}</h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                <Trophy className="size-3" /> #{data.rank}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">@{data.username}</p>
            {data.bio && <p className="mt-2 text-sm text-foreground/80 max-w-xl">{data.bio}</p>}

            {/* meta row */}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
              {data.location && (
                <span className="flex items-center gap-1"><MapPin className="size-3" />{data.location}</span>
              )}
              {data.website && (
                <a href={data.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-primary">
                  <Globe className="size-3" /> Website <ExternalLink className="size-2.5" />
                </a>
              )}
              {data.githubUrl && (
                <a href={data.githubUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-primary">
                  <GithubIcon className="size-3" /> GitHub <ExternalLink className="size-2.5" />
                </a>
              )}
              {data.linkedinUrl && (
                <a href={data.linkedinUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-[#0077b5]">
                  <LinkedinIcon className="size-3" /> LinkedIn <ExternalLink className="size-2.5" />
                </a>
              )}
              <span>Joined {format(new Date(data.joinedAt), "MMM yyyy")}</span>
            </div>
          </div>

          {/* stats strip */}
          <div className="mt-4 flex flex-wrap divide-x overflow-hidden rounded-xl border bg-muted/30">
            <StatPill label="Solved" value={String(data.solved.total)} color="text-easy" />
            <StatPill label="Attempted" value={String(data.attempted)} color="text-primary" />
            <StatPill label="Success rate" value={data.successRate !== null ? `${data.successRate}%` : "—"} />
            <StatPill label="Streak" value={`${data.streak.current}d`} color="text-medium" />
            <StatPill label="Frontend" value={String(data.frontendCompleted)} />
            <StatPill label="Badges" value={String(data.badges.length)} color="text-yellow-500" />
          </div>
        </div>
      </div>

      {/* ── level card ── */}
      <div className="flex items-center gap-4 rounded-xl border bg-card px-5 py-4">
        <LevelRing level={data.level} percent={levelPercent} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between text-sm mb-1.5">
            <span className="font-semibold">Level {data.level}</span>
            <span className="text-xs text-muted-foreground">{data.xpIntoLevel} / {data.xpForNextLevel} XP</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-[#006bff] transition-all" style={{ width: `${levelPercent}%` }} />
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">{data.xp.toLocaleString()} total XP · {data.xpForNextLevel - data.xpIntoLevel} XP to level {data.level + 1}</p>
        </div>
      </div>

      {/* ── tabs ── */}
      <div className="flex gap-0.5 rounded-xl border bg-muted/40 p-1">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 rounded-lg py-2 text-sm font-medium transition-colors",
              tab === t
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t}
            {t === "Badges" && data.badges.length > 0 && (
              <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">{data.badges.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Overview tab ── */}
      {tab === "Overview" && (
        <div className="space-y-4">
          {/* difficulty breakdown */}
          <Card className="py-0">
            <CardContent className="p-5">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
                <Medal className="size-4 text-primary" /> Difficulty breakdown
                <span className="ml-auto text-xs font-normal text-muted-foreground">{data.solved.total}/{data.totalQuestions.total} · {solvedPercent}%</span>
              </h2>
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { label: "Easy", solved: data.solved.easy, total: data.totalQuestions.easy, bar: "bg-easy", text: "text-easy" },
                  { label: "Medium", solved: data.solved.medium, total: data.totalQuestions.medium, bar: "bg-medium", text: "text-medium" },
                  { label: "Hard", solved: data.solved.hard, total: data.totalQuestions.hard, bar: "bg-hard", text: "text-hard" },
                ].map((seg) => {
                  const pct = seg.total > 0 ? Math.round((seg.solved / seg.total) * 100) : 0;
                  return (
                    <div key={seg.label}>
                      <div className="mb-1.5 flex justify-between">
                        <span className={cn("text-xs font-semibold", seg.text)}>{seg.label}</span>
                        <span className="text-xs text-muted-foreground">{seg.solved}/{seg.total}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div className={cn("h-full rounded-full", seg.bar)} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* progress tracks */}
          {data.progress.length > 0 && (
            <Card className="py-0">
              <CardContent className="p-5">
                <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
                  <TrendingUp className="size-4 text-primary" /> Roadmap progress
                </h2>
                <div className="space-y-3">
                  {data.progress.map((entry) => (
                    <Link key={entry.track} href={`/roadmaps/${entry.track}`} className="group block">
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="font-medium capitalize group-hover:text-primary">
                          {entry.track === "dsa" ? "DSA Roadmap" : "Frontend Roadmap"}
                        </span>
                        <span className="text-muted-foreground">{entry.percent}%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${entry.percent}%` }} />
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* recent submissions */}
          <Card className="py-0">
            <CardContent className="p-5">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
                <Zap className="size-4 text-primary" /> Recent submissions
              </h2>
              {data.recentSubmissions.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  {isOwner ? "No submissions yet — start solving!" : "No submissions yet."}
                </p>
              ) : (
                <ul className="-mx-2 space-y-0.5">
                  {data.recentSubmissions.map((s) => (
                    <li key={s.id}>
                      <Link href={`/problems/${s.slug}`} className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-accent/50">
                        <span className={cn("size-2 shrink-0 rounded-full", s.status === "Accepted" ? "bg-easy" : "bg-hard")} />
                        <span className="min-w-0 flex-1 truncate font-medium">{s.title}</span>
                        {s.language && (
                          <Badge variant="outline" className="hidden text-[10px] sm:inline-flex">{s.language}</Badge>
                        )}
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(s.createdAt), { addSuffix: true })}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Badges tab ── */}
      {tab === "Badges" && (
        <Card className="py-0">
          <CardContent className="p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
              <Award className="size-4 text-primary" /> Badges earned
              <span className="ml-auto text-xs font-normal text-muted-foreground">{data.badges.length} total</span>
            </h2>
            {data.badges.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">No badges yet — solve problems to earn them!</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {data.badges.map((badge) => (
                  <Tooltip key={badge.key}>
                    <TooltipTrigger asChild>
                      <div className={cn("flex items-center gap-3 rounded-lg border px-3 py-2.5 cursor-default", TIER_STYLES[badge.tier] ?? TIER_STYLES.bronze)}>
                        <span className="text-xl">{badge.icon}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold">{badge.name}</p>
                          <p className="truncate text-xs opacity-70">{badge.description}</p>
                        </div>
                        <span className="shrink-0 text-[10px] uppercase font-bold opacity-60">{badge.tier}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="text-xs">
                      Earned {formatDistanceToNow(new Date(badge.awardedAt), { addSuffix: true })}
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Activity tab ── */}
      {tab === "Activity" && (
        <div className="space-y-4">
          <Card className="py-0">
            <CardContent className="p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 text-sm font-semibold">
                  <TrendingUp className="size-4 text-primary" /> Activity heatmap
                </h2>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Flame className="size-3.5 text-medium" />{data.streak.current}-day streak</span>
                  <span className="flex items-center gap-1"><Flame className="size-3.5 text-muted-foreground" />Best {data.streak.longest}d</span>
                </div>
              </div>
              <ActivityHeatmap days={data.heatmap} />
            </CardContent>
          </Card>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: CheckCircle2, label: "Total solved", value: String(data.solved.total), color: "text-easy bg-easy/10" },
              { icon: Target, label: "Success rate", value: data.successRate !== null ? `${data.successRate}%` : "—", color: "text-primary bg-primary/10" },
              { icon: Flame, label: "Current streak", value: `${data.streak.current}d`, color: "text-medium bg-medium/10" },
              { icon: Paintbrush, label: "Frontend done", value: String(data.frontendCompleted), color: "text-purple-500 bg-purple-500/10" },
            ].map((stat) => (
              <Card key={stat.label} className="py-0 transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground/15 hover:shadow-md">
                <CardContent className="p-4">
                  <div className={cn("mb-2.5 flex size-8 items-center justify-center rounded-lg", stat.color)}>
                    <stat.icon className="size-4" />
                  </div>
                  <p className="text-xl font-bold tabular-nums">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
