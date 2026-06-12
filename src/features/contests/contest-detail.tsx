"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  CalendarClock,
  CheckCircle2,
  Loader2,
  Timer,
  Trophy,
  Users,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { Markdown } from "@/components/shared/markdown";
import { cn } from "@/lib/utils";
import type {
  ContestDetail,
  ContestLeaderboardEntry,
} from "@/services/contests";
import { Countdown, STATUS_STYLES } from "./contest-card";

export function ContestDetailView({ contest }: { contest: ContestDetail }) {
  const router = useRouter();

  const joinMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/contests/${contest.slug}/join`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to join");
    },
    onSuccess: () => {
      toast.success("You're in! Good luck 🍀");
      router.refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            {contest.title}
          </h1>
          <span
            className={cn(
              "rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
              STATUS_STYLES[contest.status],
            )}
          >
            {contest.status}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <CalendarClock className="size-4" />
            {format(new Date(contest.startsAt), "MMM d, yyyy HH:mm")}
          </span>
          <span className="flex items-center gap-1">
            <Timer className="size-4" /> {contest.durationMinutes} min
          </span>
          <span className="flex items-center gap-1">
            <Users className="size-4" /> {contest.participantCount} participants
          </span>
        </div>
      </div>

      {/* Countdown / state banner */}
      <Card className="mb-6 py-0">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
          {contest.status === "upcoming" && (
            <>
              <div className="text-sm">
                <p className="text-muted-foreground">Starts in</p>
                <p className="text-xl font-semibold text-primary">
                  <Countdown
                    target={contest.startsAt}
                    onComplete={() => router.refresh()}
                  />
                </p>
              </div>
              <JoinButton
                joined={contest.joined}
                pending={joinMutation.isPending}
                onJoin={() => joinMutation.mutate()}
              />
            </>
          )}
          {contest.status === "live" && (
            <>
              <div className="text-sm">
                <p className="text-muted-foreground">Time remaining</p>
                <p className="text-xl font-semibold text-success">
                  <Countdown
                    target={contest.endsAt}
                    onComplete={() => router.refresh()}
                  />
                </p>
              </div>
              <JoinButton
                joined={contest.joined}
                pending={joinMutation.isPending}
                onJoin={() => joinMutation.mutate()}
              />
            </>
          )}
          {contest.status === "ended" && (
            <p className="text-sm text-muted-foreground">
              This contest has ended. You can still browse the problems and the
              final standings.
            </p>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="problems">
        <TabsList>
          <TabsTrigger value="problems">Problems</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          {contest.description && (
            <TabsTrigger value="about">About</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="problems" className="mt-4">
          {contest.questions === null ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              {contest.status === "upcoming"
                ? "Problems are revealed when the contest starts."
                : "Join the contest to see the problems."}
            </p>
          ) : (
            <div className="overflow-hidden rounded-xl border">
              {contest.questions.map((question, index) => (
                <Link
                  key={question.slug}
                  href={
                    contest.status === "live"
                      ? `/problems/${question.slug}?contest=${contest.slug}`
                      : `/problems/${question.slug}`
                  }
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/50",
                    index % 2 === 1 && "bg-muted/30",
                  )}
                >
                  {question.solved ? (
                    <CheckCircle2 className="size-4 text-success" />
                  ) : (
                    <span className="size-4 text-center text-xs text-muted-foreground">
                      {String.fromCharCode(65 + index)}
                    </span>
                  )}
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {question.title}
                  </span>
                  <DifficultyBadge difficulty={question.difficulty} />
                  <Badge variant="outline">{question.points} pts</Badge>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="leaderboard" className="mt-4">
          <ContestLeaderboard
            slug={contest.slug}
            live={contest.status === "live"}
          />
        </TabsContent>

        {contest.description && (
          <TabsContent value="about" className="mt-4">
            <Markdown>{contest.description}</Markdown>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

function JoinButton({
  joined,
  pending,
  onJoin,
}: {
  joined: boolean;
  pending: boolean;
  onJoin: () => void;
}) {
  if (joined) {
    return (
      <Badge variant="secondary" className="text-sm">
        <CheckCircle2 className="size-3.5" /> Registered
      </Badge>
    );
  }
  return (
    <Button onClick={onJoin} disabled={pending}>
      {pending && <Loader2 className="size-4 animate-spin" />}
      Join contest
    </Button>
  );
}

function ContestLeaderboard({ slug, live }: { slug: string; live: boolean }) {
  const { data, isLoading } = useQuery<{
    leaderboard: ContestLeaderboardEntry[];
  }>({
    queryKey: ["contest-leaderboard", slug],
    queryFn: async () => {
      const res = await fetch(`/api/contests/${slug}/leaderboard`);
      if (!res.ok) throw new Error("Failed to load leaderboard");
      return res.json();
    },
    refetchInterval: live ? 30_000 : false,
  });

  if (isLoading) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Loading standings...
      </p>
    );
  }

  const entries = data?.leaderboard ?? [];
  if (entries.length === 0) {
    return (
      <div className="py-12 text-center">
        <Trophy className="mx-auto mb-2 size-6 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">No participants yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border">
      {entries.map((entry) => (
        <div
          key={entry.username}
          className="flex items-center gap-3 border-b px-4 py-2.5 text-sm last:border-0"
        >
          <span className="w-6 text-center font-medium text-muted-foreground">
            {entry.rank}
          </span>
          <Avatar className="size-7">
            <AvatarImage src={entry.image ?? undefined} alt={entry.name} />
            <AvatarFallback className="text-[10px]">
              {entry.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <Link
            href={`/profile/${entry.username}`}
            className="min-w-0 flex-1 truncate hover:underline"
          >
            {entry.name}
          </Link>
          <span className="text-xs text-muted-foreground">
            {entry.solvedCount} solved
          </span>
          <span className="w-16 text-right font-semibold text-primary">
            {entry.score} pts
          </span>
        </div>
      ))}
    </div>
  );
}
