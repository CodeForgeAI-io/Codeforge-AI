import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { ArrowRight, Code2, Flame, Sparkles } from "lucide-react";
import { auth } from "@/lib/auth";
import { getDashboardData } from "@/services/stats";
import { getDailyChallenge } from "@/services/contests";
import { StatsOverview } from "@/features/dashboard/stats-overview";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { Button } from "@/components/ui/button";
import { XP_DAILY_CHALLENGE_BONUS } from "@/lib/constants";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [data, daily] = await Promise.all([
    getDashboardData(session.user.id),
    getDailyChallenge().catch(() => null),
  ]);
  if (!data) redirect("/login");

  const firstName = data.name.split(" ")[0];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      {/* greeting + quick actions */}
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3 sm:mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Welcome back, {firstName} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {format(new Date(), "EEEE, MMMM d")} — keep the streak alive.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/generate">
              <Sparkles className="size-4 text-primary" /> Generate
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/problems">
              <Code2 className="size-4" /> Solve problems
            </Link>
          </Button>
        </div>
      </div>

      {/* daily challenge banner */}
      {daily && (
        <Link href={`/problems/${daily.slug}`} className="group mb-5 block sm:mb-6">
          <div className="flex flex-wrap items-center gap-3 rounded-xl border-2 border-primary/30 bg-primary/5 px-4 py-3 transition-colors group-hover:border-primary/60">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Flame className="size-4.5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-wide text-primary">
                Daily challenge · +{XP_DAILY_CHALLENGE_BONUS} bonus XP
              </p>
              <p className="truncate text-sm font-semibold">{daily.title}</p>
            </div>
            <DifficultyBadge difficulty={daily.difficulty} />
            <ArrowRight className="size-4 shrink-0 text-primary transition-transform group-hover:translate-x-0.5" />
          </div>
        </Link>
      )}

      <StatsOverview data={data} isOwner />
    </div>
  );
}
