"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BarChart3, TrendingUp, Award, Zap, Target, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface WeaknessItem { category: string; attempted: number; accepted: number; rate: number }
interface Recommendation { category: string; reason: string; priority: "high" | "medium" }

interface AnalyticsData {
  analysis: WeaknessItem[];
  weakAreas: WeaknessItem[];
  strongAreas: WeaknessItem[];
  recommendations: Recommendation[];
}

const MASTERY_LEVELS = [
  { label: "Novice", min: 0, max: 20, color: "text-muted-foreground" },
  { label: "Learner", min: 20, max: 40, color: "text-blue-500" },
  { label: "Practitioner", min: 40, max: 60, color: "text-medium" },
  { label: "Expert", min: 60, max: 80, color: "text-primary" },
  { label: "Master", min: 80, max: 100, color: "text-easy" },
];

function getMastery(rate: number) {
  return MASTERY_LEVELS.find((l) => rate >= l.min && rate < l.max) ?? MASTERY_LEVELS[0];
}

function getMasteryBar(rate: number) {
  if (rate >= 80) return "[&>div]:bg-easy";
  if (rate >= 60) return "[&>div]:bg-primary";
  if (rate >= 40) return "[&>div]:bg-medium";
  return "[&>div]:bg-destructive";
}

export function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/weakness").then((r) => r.json()).then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="space-y-4">
      {[...Array(4)].map((_, i) => <div key={i} className="h-40 rounded-xl bg-muted animate-pulse" />)}
    </div>
  );

  const totalAttempted = data?.analysis.reduce((s, a) => s + a.attempted, 0) ?? 0;
  const totalAccepted = data?.analysis.reduce((s, a) => s + a.accepted, 0) ?? 0;
  const overallRate = totalAttempted > 0 ? Math.round((totalAccepted / totalAttempted) * 100) : 0;
  const topCategory = [...(data?.analysis ?? [])].sort((a, b) => b.rate - a.rate)[0];
  const masteredCount = data?.analysis.filter((a) => a.rate >= 80).length ?? 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Overall Rate", value: `${overallRate}%`, icon: TrendingUp, color: "text-primary" },
          { label: "Topics Tried", value: String(data?.analysis.length ?? 0), icon: BarChart3, color: "text-blue-500" },
          { label: "Mastered", value: String(masteredCount), icon: Award, color: "text-easy" },
          { label: "Total Solved", value: String(totalAccepted), icon: Zap, color: "text-medium" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4 text-center">
              <stat.icon className={cn("mx-auto mb-1 size-5", stat.color)} />
              <p className="text-xl font-black">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {data?.analysis.length ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Topic Mastery Map</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.analysis.map((item) => {
              const mastery = getMastery(item.rate);
              return (
                <div key={item.category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.category}</span>
                      <span className={cn("text-[10px] font-semibold", mastery.color)}>{mastery.label}</span>
                    </div>
                    <span className="text-muted-foreground">{item.accepted}/{item.attempted} · {item.rate}%</span>
                  </div>
                  <Progress value={item.rate} className={cn("h-2", getMasteryBar(item.rate))} />
                </div>
              );
            })}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <BarChart3 className="mx-auto mb-3 size-10 text-muted-foreground/30" />
            <p className="font-medium">No data yet</p>
            <p className="text-sm text-muted-foreground mt-1">Solve some problems to see your analytics</p>
            <Button asChild className="mt-4" size="sm">
              <Link href="/problems">Start Solving <ArrowRight className="ml-1.5 size-3.5" /></Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {data?.recommendations.length ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm"><Target className="size-4 text-primary" />Personalized Recommendations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.recommendations.map((r, i) => (
              <div key={i} className={cn("flex items-start justify-between gap-3 rounded-lg border px-3 py-2.5", r.priority === "high" ? "border-destructive/30 bg-destructive/5" : "border-medium/30 bg-medium/5")}>
                <div>
                  <p className="text-sm font-medium">{r.category}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{r.reason}</p>
                </div>
                <Button asChild variant="outline" size="sm" className="shrink-0 h-7 text-xs">
                  <Link href={`/problems?category=${encodeURIComponent(r.category)}`}>Practice</Link>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        {data?.strongAreas.slice(0, 3).length ? (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-easy">💪 Strengths</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {data.strongAreas.slice(0, 3).map((a) => (
                <div key={a.category} className="flex justify-between text-xs">
                  <span>{a.category}</span>
                  <Badge variant="outline" className="text-easy border-easy/30 text-[10px]">{a.rate}%</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}
        {data?.weakAreas.slice(0, 3).length ? (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-destructive">🎯 Focus Areas</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {data.weakAreas.slice(0, 3).map((a) => (
                <div key={a.category} className="flex justify-between text-xs">
                  <span>{a.category}</span>
                  <Badge variant="outline" className="text-destructive border-destructive/30 text-[10px]">{a.rate}%</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
