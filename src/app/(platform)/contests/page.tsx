import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { CalendarClock, Flame, Trophy, Users } from "@/components/icons";
import { getSession } from "@/lib/session";
import { listContests, getDailyChallenge } from "@/services/contests";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { cn } from "@/lib/utils";
import { STATUS_STYLES } from "@/features/contests/contest-card";
import { XP_DAILY_CHALLENGE_BONUS } from "@/lib/constants";

export const metadata: Metadata = { title: "Contests" };
export const dynamic = "force-dynamic";

export default async function ContestsPage() {
  const session = await getSession();
  const [contests, daily] = await Promise.all([
    listContests(session?.user?.id),
    getDailyChallenge(),
  ]);

  const live = contests.filter((contest) => contest.status === "live");
  const upcoming = contests.filter((contest) => contest.status === "upcoming");
  const ended = contests.filter((contest) => contest.status === "ended");

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Contests</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Compete on the clock and climb the leaderboard.
        </p>
      </div>

      {daily && (
        <Card className="mb-6 border-warning/30 bg-warning/5 py-0">
          <CardContent className="flex flex-wrap items-center gap-3 p-4">
            <Flame className="size-5 text-warning" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Daily Challenge</p>
              <p className="truncate text-sm text-muted-foreground">
                {daily.title}
              </p>
            </div>
            <DifficultyBadge difficulty={daily.difficulty} />
            <Badge variant="outline" className="text-warning">
              +{XP_DAILY_CHALLENGE_BONUS} bonus XP
            </Badge>
            <Button asChild size="sm">
              <Link href={`/problems/${daily.slug}`}>Solve now</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {contests.length === 0 ? (
        <div className="py-16 text-center">
          <Trophy className="mx-auto mb-3 size-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            No contests scheduled yet. Check back soon!
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {[
            { label: "Live now", items: live },
            { label: "Upcoming", items: upcoming },
            { label: "Past contests", items: ended },
          ]
            .filter((group) => group.items.length > 0)
            .map((group) => (
              <section key={group.label}>
                <h2 className="mb-3 text-base font-semibold">{group.label}</h2>
                <div className="space-y-2">
                  {group.items.map((contest) => (
                    <Link
                      key={contest.slug}
                      href={`/contests/${contest.slug}`}
                      className="block"
                    >
                      <Card className="py-0 transition-colors hover:border-primary/40">
                        <CardContent className="flex flex-wrap items-center gap-3 p-4">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium">{contest.title}</p>
                            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <CalendarClock className="size-3.5" />
                                {format(
                                  new Date(contest.startsAt),
                                  "MMM d, yyyy HH:mm",
                                )}
                              </span>
                              <span>{contest.durationMinutes} min</span>
                              <span>{contest.questionCount} problems</span>
                              <span className="flex items-center gap-1">
                                <Users className="size-3.5" />
                                {contest.participantCount}
                              </span>
                            </div>
                          </div>
                          {contest.joined && (
                            <Badge variant="secondary">Joined</Badge>
                          )}
                          <span
                            className={cn(
                              "rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
                              STATUS_STYLES[contest.status],
                            )}
                          >
                            {contest.status}
                          </span>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
        </div>
      )}
    </div>
  );
}
