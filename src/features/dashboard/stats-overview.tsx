import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import {
  Award,
  CheckCircle2,
  Flame,
  Globe,
  MapPin,
  Medal,
  Paintbrush,
  Target,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { DashboardData } from "@/services/stats";
import { ActivityHeatmap } from "./heatmap";

const TIER_STYLES: Record<string, string> = {
  bronze: "border-orange-400/40 bg-orange-400/10 text-orange-600 dark:text-orange-300",
  silver: "border-slate-400/40 bg-slate-400/10 text-slate-600 dark:text-slate-300",
  gold: "border-yellow-500/50 bg-yellow-400/10 text-yellow-600 dark:text-yellow-300",
};

/** Small SVG progress ring showing level completion */
function LevelRing({ level, percent }: { level: number; percent: number }) {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const dash = circumference * Math.min(Math.max(percent, 0), 100) / 100;

  return (
    <div className="relative size-[76px] shrink-0">
      <svg viewBox="0 0 76 76" className="size-full -rotate-90">
        <circle cx="38" cy="38" r={radius} fill="none" strokeWidth="6" className="stroke-muted" />
        <circle
          cx="38" cy="38" r={radius} fill="none" strokeWidth="6" strokeLinecap="round"
          className="stroke-primary"
          strokeDasharray={`${dash} ${circumference - dash}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">Lvl</span>
        <span className="text-xl font-bold leading-none">{level}</span>
      </div>
    </div>
  );
}

export function StatsOverview({
  data,
  isOwner,
}: {
  data: DashboardData;
  isOwner: boolean;
}) {
  const initials = data.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const solvedPercent =
    data.totalQuestions.total > 0
      ? Math.round((data.solved.total / data.totalQuestions.total) * 100)
      : 0;
  const levelPercent = Math.round(
    (data.xpIntoLevel / Math.max(data.xpForNextLevel, 1)) * 100,
  );

  const difficultySegments = [
    { label: "Easy", solved: data.solved.easy, total: data.totalQuestions.easy, bar: "bg-easy", text: "text-easy" },
    { label: "Medium", solved: data.solved.medium, total: data.totalQuestions.medium, bar: "bg-medium", text: "text-medium" },
    { label: "Hard", solved: data.solved.hard, total: data.totalQuestions.hard, bar: "bg-hard", text: "text-hard" },
  ];

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* ── identity + level ─────────────────────────────────────── */}
      <Card className="overflow-hidden py-0">
        <div className="h-1.5 w-full bg-primary" />
        <CardContent className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <Avatar className="size-14 shrink-0 border-2 border-primary/40 sm:size-16">
              <AvatarImage src={data.image ?? undefined} alt={data.name} />
              <AvatarFallback className="bg-primary/10 text-lg font-bold text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold tracking-tight sm:text-xl">
                {data.name}
              </h1>
              <p className="truncate text-sm text-muted-foreground">
                @{data.username}
              </p>
              {data.bio && (
                <p className="mt-1 line-clamp-1 text-sm text-foreground/80">
                  {data.bio}
                </p>
              )}
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                {data.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3" /> {data.location}
                  </span>
                )}
                {data.website && (
                  <a href={data.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-primary">
                    <Globe className="size-3" /> Website
                  </a>
                )}
                <span>Joined {format(new Date(data.joinedAt), "MMM yyyy")}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 border-t pt-4 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
            <LevelRing level={data.level} percent={levelPercent} />
            <div className="space-y-1">
              <p className="text-sm font-semibold">
                {data.xpIntoLevel}
                <span className="text-muted-foreground"> / {data.xpForNextLevel} XP</span>
              </p>
              <p className="text-xs text-muted-foreground">to level {data.level + 1}</p>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                <Trophy className="size-3" /> Rank #{data.rank}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── key stats ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 sm:gap-4">
        <StatCard
          icon={CheckCircle2}
          tone="text-easy bg-easy/10"
          label="Solved"
          value={String(data.solved.total)}
          sub={`${solvedPercent}% of ${data.totalQuestions.total}`}
        />
        <StatCard
          icon={Target}
          tone="text-primary bg-primary/10"
          label="Success rate"
          value={data.successRate !== null ? `${data.successRate}%` : "—"}
          sub={`${data.attempted} attempted`}
        />
        <StatCard
          icon={Flame}
          tone="text-warning bg-warning/10"
          label="Streak"
          value={`${data.streak.current}d`}
          sub={`best ${data.streak.longest}d`}
        />
        <StatCard
          icon={Paintbrush}
          tone="text-medium bg-medium/10"
          label="Frontend"
          value={String(data.frontendCompleted)}
          sub="challenges done"
        />
      </div>

      {/* ── difficulty breakdown ─────────────────────────────────── */}
      <Card className="py-0">
        <CardContent className="p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Medal className="size-4 text-primary" /> Difficulty breakdown
            </h2>
            <span className="text-xs text-muted-foreground">
              {data.solved.total}/{data.totalQuestions.total} solved
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {difficultySegments.map((segment) => {
              const percent = segment.total > 0 ? Math.round((segment.solved / segment.total) * 100) : 0;
              return (
                <div key={segment.label}>
                  <div className="mb-1.5 flex items-baseline justify-between">
                    <span className={cn("text-xs font-semibold", segment.text)}>
                      {segment.label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {segment.solved}/{segment.total}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn("h-full rounded-full transition-all", segment.bar)}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── activity ─────────────────────────────────────────────── */}
      <Card className="py-0">
        <CardContent className="p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <TrendingUp className="size-4 text-primary" /> Activity
            </h2>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Flame className="size-3.5 text-warning" /> {data.streak.current}-day streak
              </span>
              <span className="flex items-center gap-1">
                <Zap className="size-3.5 text-primary" /> {data.xp} XP total
              </span>
            </div>
          </div>
          <ActivityHeatmap days={data.heatmap} />
          {data.progress.length > 0 && (
            <div className="mt-5 grid gap-3 border-t pt-4 sm:grid-cols-2">
              {data.progress.map((entry) => (
                <Link
                  key={entry.track}
                  href={`/roadmaps/${entry.track}`}
                  className="group"
                >
                  <div className="mb-1 flex items-center justify-between text-xs">
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
          )}
        </CardContent>
      </Card>

      {/* ── badges + recent submissions ──────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="py-0">
          <CardContent className="p-5 sm:p-6">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
              <Award className="size-4 text-primary" /> Badges
              <span className="ml-auto text-xs font-normal text-muted-foreground">
                {data.badges.length} earned
              </span>
            </h2>
            {data.badges.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No badges yet — solve problems to earn them!
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {data.badges.map((badge) => (
                  <Tooltip key={badge.key}>
                    <TooltipTrigger asChild>
                      <span
                        className={cn(
                          "inline-flex cursor-default items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold",
                          TIER_STYLES[badge.tier] ?? TIER_STYLES.bronze,
                        )}
                      >
                        <Award className="size-3.5" />
                        {badge.name}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent className="text-xs">
                      {badge.description}
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="py-0">
          <CardContent className="p-5 sm:p-6">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
              <Zap className="size-4 text-primary" /> Recent submissions
            </h2>
            {data.recentSubmissions.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {isOwner ? "No submissions yet. Start solving!" : "No submissions yet."}
              </p>
            ) : (
              <ul className="-mx-2 space-y-0.5">
                {data.recentSubmissions.map((submission) => (
                  <li key={submission.id}>
                    <Link
                      href={`/problems/${submission.slug}`}
                      className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-accent/50"
                    >
                      <span
                        className={cn(
                          "size-2 shrink-0 rounded-full",
                          submission.status === "Accepted" ? "bg-easy" : "bg-hard",
                        )}
                      />
                      <span className="min-w-0 flex-1 truncate font-medium">
                        {submission.title}
                      </span>
                      {submission.language && (
                        <Badge variant="outline" className="hidden text-[10px] sm:inline-flex">
                          {submission.language}
                        </Badge>
                      )}
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(submission.createdAt), { addSuffix: true })}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  tone,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <Card className="py-0">
      <CardContent className="p-4 sm:p-5">
        <div className={cn("mb-3 flex size-9 items-center justify-center rounded-lg", tone)}>
          <Icon className="size-4.5" />
        </div>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        <p className="mt-0.5 text-xs font-medium text-muted-foreground">
          {label} <span className="font-normal">· {sub}</span>
        </p>
      </CardContent>
    </Card>
  );
}
