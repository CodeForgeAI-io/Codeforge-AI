"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { TrendingUp, TrendingDown, AlertTriangle, Target, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface WeaknessData {
  analysis: { category: string; attempted: number; accepted: number; rate: number }[];
  weakAreas: { category: string; attempted: number; accepted: number; rate: number }[];
  strongAreas: { category: string; attempted: number; accepted: number; rate: number }[];
  recommendations: { category: string; reason: string; priority: "high" | "medium" }[];
}

interface DailyPlan {
  date: string;
  tasks: { question: { slug: string; title: string; difficulty: string; category: string }; estimatedMins: number }[];
  totalMins: number;
  focus: string;
}

export function WeaknessDashboard() {
  const [data, setData] = useState<WeaknessData | null>(null);
  const [plan, setPlan] = useState<DailyPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/weakness").then((r) => r.json()),
      fetch("/api/daily-plan").then((r) => r.json()),
    ]).then(([w, p]) => {
      setData(w);
      setPlan(p);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {[...Array(4)].map((_, i) => <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {plan && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="size-4 text-primary" />
                Today's Plan
              </CardTitle>
              <Badge variant="outline" className="text-xs">{plan.totalMins} mins</Badge>
            </div>
            <p className="text-xs text-muted-foreground">Focus: {plan.focus}</p>
          </CardHeader>
          <CardContent className="space-y-2">
            {plan.tasks.map(({ question: q, estimatedMins }) => (
              <Link
                key={q.slug}
                href={`/problems/${q.slug}`}
                className="flex items-center justify-between rounded-lg bg-background/60 px-3 py-2 transition-colors hover:bg-background"
              >
                <div>
                  <p className="text-sm font-medium">{q.title}</p>
                  <p className="text-xs text-muted-foreground">{q.category}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={cn(
                    "text-xs font-medium",
                    q.difficulty === "Easy" ? "text-easy" : q.difficulty === "Medium" ? "text-medium" : "text-hard",
                  )}>{q.difficulty}</span>
                  <span className="text-xs text-muted-foreground">{estimatedMins}m</span>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm text-destructive">
              <TrendingDown className="size-4" />
              Weak Areas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data?.weakAreas.slice(0, 5).map((a) => (
              <div key={a.category} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium">{a.category}</span>
                  <span className="text-destructive">{a.rate}%</span>
                </div>
                <Progress value={a.rate} className="h-1.5 [&>div]:bg-destructive" />
              </div>
            ))}
            {!data?.weakAreas.length && (
              <p className="text-xs text-muted-foreground">Solve more problems to see weak areas</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm text-easy">
              <TrendingUp className="size-4" />
              Strong Areas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data?.strongAreas.slice(0, 5).map((a) => (
              <div key={a.category} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium">{a.category}</span>
                  <span className="text-easy">{a.rate}%</span>
                </div>
                <Progress value={a.rate} className="h-1.5 [&>div]:bg-easy" />
              </div>
            ))}
            {!data?.strongAreas.length && (
              <p className="text-xs text-muted-foreground">Keep solving to identify strong areas</p>
            )}
          </CardContent>
        </Card>
      </div>

      {data?.recommendations.length ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Target className="size-4 text-primary" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.recommendations.map((r, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg border px-3 py-2.5">
                <AlertTriangle className={cn("size-4 mt-0.5 shrink-0", r.priority === "high" ? "text-destructive" : "text-medium")} />
                <div>
                  <p className="text-sm font-medium">{r.category}</p>
                  <p className="text-xs text-muted-foreground">{r.reason}</p>
                </div>
                <Button asChild variant="outline" size="sm" className="ml-auto shrink-0 h-7 text-xs">
                  <Link href={`/problems?category=${encodeURIComponent(r.category)}`}>Practice</Link>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {data?.analysis.length ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Category Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {data.analysis.map((a) => (
              <div key={a.category} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium">{a.category}</span>
                  <span className="text-muted-foreground">{a.accepted}/{a.attempted} ({a.rate}%)</span>
                </div>
                <Progress
                  value={a.rate}
                  className={cn("h-1.5", a.rate < 50 ? "[&>div]:bg-destructive" : a.rate >= 80 ? "[&>div]:bg-easy" : "[&>div]:bg-medium")}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
