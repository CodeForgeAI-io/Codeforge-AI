import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import {
  Award,
  CheckCircle2,
  Flame,
  Globe,
  MapPin,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress as ProgressBar } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { DashboardData } from "@/services/stats";
import { ActivityHeatmap } from "./heatmap";

const TIER_STYLES: Record<string, string> = {
  bronze: "border-orange-400/40 bg-orange-400/10 text-orange-500 dark:text-orange-300",
  silver: "border-slate-300/50 bg-slate-300/10 text-slate-500 dark:text-slate-300",
  gold: "border-yellow-400/50 bg-yellow-400/10 text-yellow-600 dark:text-yellow-300",
};

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

  return (
    <div className="space-y-4">
      {/* Identity + level */}
      <Card className="glass">
        <CardContent className="flex flex-wrap items-center gap-4">
          <Avatar className="size-16">
            <AvatarImage src={data.image ?? undefined} alt={data.name} />
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-semibold">{data.name}</h1>
            <p className="text-sm text-muted-foreground">@{data.username}</p>
            {data.bio && <p className="mt-1 text-sm">{data.bio}</p>}
            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              {data.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="size-3" /> {data.location}
                </span>
              )}
              {data.website && (
                <a
                  href={data.website}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 hover:text-foreground"
                >
                  <Globe className="size-3" /> Website
                </a>
              )}
              <span>Joined {format(new Date(data.joinedAt), "MMM yyyy")}</span>
            </div>
          </div>
          <div className="w-full sm:w-56">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-medium text-primary">
                Level {data.level}
              </span>
              <span className="text-muted-foreground">
                {data.xpIntoLevel}/{data.xpForNextLevel} XP
              </span>
            </div>
            <ProgressBar
              value={(data.xpIntoLevel / Math.max(data.xpForNextLevel, 1)) * 100}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Rank #{data.rank} · {data.xp} XP total
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={<CheckCircle2 className="size-4 text-success" />}
          label="Solved"
          value={`${data.solved.total}`}
          sub={`${data.totalQuestions.total} available`}
        >
          <div className="mt-2 space-y-1 text-xs">
            <SolvedRow label="Easy" solved={data.solved.easy} total={data.totalQuestions.easy} color="text-easy" />
            <SolvedRow label="Medium" solved={data.solved.medium} total={data.totalQuestions.medium} color="text-medium" />
            <SolvedRow label="Hard" solved={data.solved.hard} total={data.totalQuestions.hard} color="text-hard" />
          </div>
        </StatCard>
        <StatCard
          icon={<Target className="size-4 text-primary" />}
          label="Success rate"
          value={data.successRate !== null ? `${data.successRate}%` : "—"}
          sub={`${data.attempted} problems attempted`}
        />
        <StatCard
          icon={<Flame className="size-4 text-warning" />}
          label="Streak"
          value={`${data.streak.current} days`}
          sub={`Longest: ${data.streak.longest} days`}
        />
        <StatCard
          icon={<Zap className="size-4 text-medium" />}
          label="Frontend"
          value={`${data.frontendCompleted}`}
          sub="challenges completed"
        />
      </div>

      {/* Heatmap */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <TrendingUp className="size-4" /> Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityHeatmap days={data.heatmap} />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Badges */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Award className="size-4" /> Badges ({data.badges.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.badges.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No badges yet — solve problems to earn them!
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {data.badges.map((badge) => (
                  <Tooltip key={badge.key}>
                    <TooltipTrigger asChild>
                      <span
                        className={cn(
                          "inline-flex cursor-default items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium",
                          TIER_STYLES[badge.tier] ?? TIER_STYLES.bronze,
                        )}
                      >
                        <Award className="size-3" />
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

        {/* Recent submissions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Recent submissions</CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentSubmissions.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                {isOwner
                  ? "No submissions yet. Start solving!"
                  : "No submissions yet."}
              </p>
            ) : (
              <ul className="space-y-2">
                {data.recentSubmissions.map((submission) => (
                  <li key={submission.id}>
                    <Link
                      href={`/problems/${submission.slug}`}
                      className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent/50"
                    >
                      <span
                        className={cn(
                          "size-1.5 shrink-0 rounded-full",
                          submission.status === "Accepted"
                            ? "bg-success"
                            : "bg-destructive",
                        )}
                      />
                      <span className="min-w-0 flex-1 truncate">
                        {submission.title}
                      </span>
                      {submission.language && (
                        <Badge variant="outline" className="text-[10px]">
                          {submission.language}
                        </Badge>
                      )}
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(submission.createdAt), {
                          addSuffix: true,
                        })}
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
  icon,
  label,
  value,
  sub,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  children?: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {icon}
          {label}
        </div>
        <p className="mt-1 text-2xl font-semibold">{value}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
        {children}
      </CardContent>
    </Card>
  );
}

function SolvedRow({
  label,
  solved,
  total,
  color,
}: {
  label: string;
  solved: number;
  total: number;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={color}>{label}</span>
      <span className="text-muted-foreground">
        {solved}/{total}
      </span>
    </div>
  );
}
