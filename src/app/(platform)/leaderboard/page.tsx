import type { Metadata } from "next";
import Link from "next/link";
import { Flame, Trophy } from "lucide-react";
import { auth } from "@/lib/auth";
import { getLeaderboard, getUserRank } from "@/services/stats";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Leaderboard" };
export const dynamic = "force-dynamic";

const MEDAL_COLORS = [
  "text-yellow-500",
  "text-slate-400",
  "text-orange-500",
];

export default async function LeaderboardPage() {
  const session = await auth();
  const [entries, myRank] = await Promise.all([
    getLeaderboard(50),
    session?.user?.id ? getUserRank(session.user.id) : Promise.resolve(0),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Leaderboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Top coders ranked by XP earned.
          </p>
        </div>
        {myRank > 0 && (
          <Badge variant="secondary" className="text-sm">
            Your rank: #{myRank}
          </Badge>
        )}
      </div>

      {entries.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          No ranked users yet. Be the first to solve a problem!
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border">
          {entries.map((entry) => (
            <Link
              key={entry.username}
              href={`/profile/${entry.username}`}
              className={cn(
                "flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/50",
                entry.username === session?.user?.username &&
                  "bg-primary/5 hover:bg-primary/10",
              )}
            >
              <span className="w-8 text-center">
                {entry.rank <= 3 ? (
                  <Trophy
                    className={cn(
                      "mx-auto size-5",
                      MEDAL_COLORS[entry.rank - 1],
                    )}
                  />
                ) : (
                  <span className="text-sm font-medium text-muted-foreground">
                    {entry.rank}
                  </span>
                )}
              </span>
              <Avatar className="size-8">
                <AvatarImage src={entry.image ?? undefined} alt={entry.name} />
                <AvatarFallback className="text-xs">
                  {entry.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{entry.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  @{entry.username}
                </p>
              </div>
              {entry.streak > 0 && (
                <span className="flex items-center gap-1 text-xs text-warning">
                  <Flame className="size-3.5" />
                  {entry.streak}
                </span>
              )}
              <span className="hidden text-xs text-muted-foreground sm:block">
                {entry.solvedTotal} solved
              </span>
              <Badge variant="outline">Lv {entry.level}</Badge>
              <span className="w-16 text-right text-sm font-semibold text-primary">
                {entry.xp} XP
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
