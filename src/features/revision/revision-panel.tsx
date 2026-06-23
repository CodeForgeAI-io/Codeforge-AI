"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Brain, CheckCircle2, Clock, RotateCcw } from "@/components/icons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Card_ {
  _id: string;
  question: { _id: string; slug: string; title: string; difficulty: string; category: string };
  nextReview: string;
  interval: number;
  repetitions: number;
  easeFactor: number;
}

const QUALITY_LABELS = [
  { label: "Blackout", value: 0, color: "bg-destructive hover:bg-destructive/90" },
  { label: "Very Hard", value: 1, color: "bg-red-600 hover:bg-red-700" },
  { label: "Hard", value: 2, color: "bg-amber-500 hover:bg-amber-600" },
  { label: "Good", value: 3, color: "bg-medium hover:bg-medium/90" },
  { label: "Easy", value: 4, color: "bg-easy hover:bg-easy/90" },
  { label: "Perfect", value: 5, color: "bg-primary hover:bg-primary/90" },
];

export function RevisionPanel() {
  const [due, setDue] = useState<Card_[]>([]);
  const [upcoming, setUpcoming] = useState<Card_[]>([]);
  const [dueCount, setDueCount] = useState(0);
  const [current, setCurrent] = useState<Card_ | null>(null);
  const [reviewed, setReviewed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(false);

  useEffect(() => {
    fetch("/api/revision")
      .then((r) => r.json())
      .then((d) => {
        setDue(d.due ?? []);
        setUpcoming(d.upcoming ?? []);
        setDueCount(d.dueCount ?? 0);
        if (d.due?.length > 0) setCurrent(d.due[0]);
      })
      .finally(() => setLoading(false));
  }, []);

  async function submitRating(quality: number) {
    if (!current) return;
    setRating(true);
    try {
      await fetch("/api/revision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: current.question._id, quality }),
      });
      const remaining = due.filter((c) => c._id !== current._id);
      setDue(remaining);
      setCurrent(remaining[0] ?? null);
      setReviewed((r) => r + 1);
    } catch {
      toast.error("Failed to save review");
    } finally {
      setRating(false);
    }
  }

  if (loading) return <div className="h-64 rounded-xl bg-muted animate-pulse" />;

  if (reviewed > 0 && due.length === 0) {
    return (
      <Card className="text-center">
        <CardContent className="py-12">
          <CheckCircle2 className="mx-auto mb-3 size-12 text-easy" />
          <h3 className="text-lg font-bold">Session Complete!</h3>
          <p className="text-sm text-muted-foreground mt-1">Reviewed {reviewed} cards today.</p>
          <Button className="mt-4" onClick={() => { setReviewed(0); }}>
            <RotateCcw className="mr-2 size-4" /> Review Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center">
          <CardContent className="py-4">
            <p className="text-2xl font-bold text-destructive">{dueCount}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Due Today</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="py-4">
            <p className="text-2xl font-bold text-primary">{reviewed}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Reviewed</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="py-4">
            <p className="text-2xl font-bold">{upcoming.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Upcoming</p>
          </CardContent>
        </Card>
      </div>

      {current ? (
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">{current.question.title}</CardTitle>
                <div className="mt-1.5 flex items-center gap-2">
                  <DifficultyBadge difficulty={current.question.difficulty} />
                  <span className="text-xs text-muted-foreground">{current.question.category}</span>
                </div>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href={`/problems/${current.question.slug}`} target="_blank">
                  Solve
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
              <Brain className="mb-1.5 size-4 text-primary" />
              Rate how well you recalled and solved this problem:
            </div>
            <div className="grid grid-cols-3 gap-2">
              {QUALITY_LABELS.map((q) => (
                <Button
                  key={q.value}
                  className={cn("text-white text-xs", q.color)}
                  onClick={() => submitRating(q.value)}
                  disabled={rating}
                >
                  {q.label}
                </Button>
              ))}
            </div>
            <p className="text-center text-xs text-muted-foreground">
              Current interval: {current.interval} day{current.interval !== 1 ? "s" : ""} · Rep #{current.repetitions}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="text-center">
          <CardContent className="py-12">
            <CheckCircle2 className="mx-auto mb-3 size-10 text-easy" />
            <p className="font-medium">All caught up!</p>
            <p className="text-sm text-muted-foreground mt-1">No cards due for review.</p>
          </CardContent>
        </Card>
      )}

      {upcoming.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Clock className="size-4" /> Upcoming Reviews
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcoming.map((c) => (
              <div key={c._id} className="flex items-center justify-between text-sm">
                <span className="font-medium">{c.question.title}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(c.nextReview).toLocaleDateString()}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
