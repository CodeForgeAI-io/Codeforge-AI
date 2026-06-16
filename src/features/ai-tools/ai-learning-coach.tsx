"use client";

import { useState, useEffect } from "react";
import { GraduationCap, Loader2, TrendingUp, Target, Lightbulb, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface NextStep { action: string; why: string; priority: "high" | "medium" | "low" }
interface Coaching {
  level: string; readinessScore: number; strengths: string[]; focusAreas: string[];
  weeklyGoal: string; motivationalMessage: string; nextSteps: NextStep[]; estimatedReadyDate: string;
}

const PRIORITY_COLORS = { high: "text-destructive border-destructive/30 bg-destructive/5", medium: "text-medium border-medium/30 bg-medium/5", low: "text-muted-foreground border-border bg-muted/30" };
const LEVEL_COLORS: Record<string, string> = { beginner: "text-easy", intermediate: "text-medium", advanced: "text-primary" };

export function AiLearningCoach() {
  const [coaching, setCoaching] = useState<Coaching | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  async function fetchCoaching() {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/learning-coach");
      const data = await res.json();
      setCoaching(data.coaching);
      setFetched(true);
    } catch { } finally { setLoading(false); }
  }

  return (
    <div className="space-y-5">
      {!fetched ? (
        <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
          <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
            <GraduationCap className="size-8 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Your Personal Learning Coach</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
              AI analyzes your solving history, weak areas, and progress to give you personalized guidance.
            </p>
          </div>
          <Button onClick={fetchCoaching} disabled={loading}>
            {loading ? <><Loader2 className="mr-2 size-4 animate-spin" />Analyzing your profile...</> : <><GraduationCap className="mr-2 size-4" />Get My Coaching Report</>}
          </Button>
        </div>
      ) : coaching ? (
        <div className="space-y-4">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Skill Level</p>
                  <p className={cn("text-2xl font-black capitalize", LEVEL_COLORS[coaching.level])}>{coaching.level}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Interview Readiness</p>
                  <p className="text-2xl font-black">{coaching.readinessScore}<span className="text-sm font-normal text-muted-foreground">/100</span></p>
                </div>
              </div>
              <Progress value={coaching.readinessScore} className="mt-3 h-2" />
              <p className="mt-3 text-sm italic text-muted-foreground">&ldquo;{coaching.motivationalMessage}&rdquo;</p>
            </CardContent>
          </Card>

          <div className="grid gap-3 sm:grid-cols-2">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm text-easy"><TrendingUp className="size-4" />Strengths</CardTitle></CardHeader>
              <CardContent className="space-y-1">
                {coaching.strengths?.map((s, i) => <p key={i} className="text-xs text-muted-foreground">✓ {s}</p>)}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm text-medium"><Target className="size-4" />Focus Areas</CardTitle></CardHeader>
              <CardContent className="space-y-1">
                {coaching.focusAreas?.map((s, i) => <p key={i} className="text-xs text-muted-foreground">→ {s}</p>)}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">This Week&apos;s Goal</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-muted-foreground">{coaching.weeklyGoal}</p></CardContent>
          </Card>

          {coaching.nextSteps?.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm"><Lightbulb className="size-4 text-primary" />Next Steps</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {coaching.nextSteps.map((step, i) => (
                  <div key={i} className={cn("rounded-lg border px-3 py-2.5", PRIORITY_COLORS[step.priority])}>
                    <p className="text-xs font-semibold">{step.action}</p>
                    <p className="text-xs mt-0.5 opacity-80">{step.why}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {coaching.estimatedReadyDate && (
            <Card>
              <CardContent className="flex items-center gap-3 py-4 px-4">
                <Clock className="size-5 text-primary shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Estimated interview-ready by</p>
                  <p className="font-semibold text-sm">{coaching.estimatedReadyDate}</p>
                </div>
              </CardContent>
            </Card>
          )}

          <Button variant="outline" size="sm" onClick={fetchCoaching} disabled={loading} className="w-full">
            {loading ? "Refreshing..." : "Refresh Coaching Report"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
