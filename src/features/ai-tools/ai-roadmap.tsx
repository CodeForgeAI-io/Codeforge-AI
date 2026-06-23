"use client";

import { useState } from "react";
import { Map, Loader2, ChevronDown, ChevronRight } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Phase {
  phase: number;
  title: string;
  weeks: string;
  topics: string[];
  resources: string[];
  milestone: string;
}

interface Roadmap {
  title: string;
  description: string;
  estimatedWeeks: number;
  phases: Phase[];
  dsaTopics: string[];
  systemDesignTopics: string[];
  tips: string[];
}

export function AiRoadmap() {
  const [goal, setGoal] = useState("");
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(0);

  async function generate() {
    if (!goal.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/ai/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRoadmap(data.roadmap);
    } catch {
      toast.error("Failed to generate roadmap. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <Input
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="e.g. Frontend Developer, Full Stack Engineer, ML Engineer..."
          onKeyDown={(e) => e.key === "Enter" && generate()}
          className="flex-1"
        />
        <Button onClick={generate} disabled={loading || !goal.trim()}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Map className="size-4" />}
          {loading ? "Generating..." : "Generate"}
        </Button>
      </div>

      {roadmap && (
        <div className="space-y-4">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <h3 className="font-bold text-lg">{roadmap.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{roadmap.description}</p>
              <Badge className="mt-2">{roadmap.estimatedWeeks} weeks estimated</Badge>
            </CardContent>
          </Card>

          <div className="space-y-2">
            {roadmap.phases?.map((phase) => (
              <Card key={phase.phase} className="cursor-pointer" onClick={() => setExpanded(expanded === phase.phase ? null : phase.phase)}>
                <CardHeader className="py-3 px-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex size-6 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                        {phase.phase}
                      </span>
                      <div>
                        <p className="text-sm font-semibold">{phase.title}</p>
                        <p className="text-xs text-muted-foreground">Week {phase.weeks}</p>
                      </div>
                    </div>
                    {expanded === phase.phase ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                  </div>
                </CardHeader>
                {expanded === phase.phase && (
                  <CardContent className="pb-4 pt-0 px-4 space-y-3">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1.5">Topics</p>
                      <div className="flex flex-wrap gap-1.5">
                        {phase.topics?.map((t) => (
                          <span key={t} className="rounded bg-muted px-2 py-0.5 text-xs">{t}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1.5">Resources</p>
                      <ul className="space-y-0.5">
                        {phase.resources?.map((r) => (
                          <li key={r} className="text-xs text-muted-foreground">• {r}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-lg bg-primary/10 px-3 py-2">
                      <p className="text-xs font-medium text-primary">Milestone: {phase.milestone}</p>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>

          {roadmap.tips?.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Pro Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {roadmap.tips.map((t, i) => (
                  <p key={i} className="text-xs text-muted-foreground">• {t}</p>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
