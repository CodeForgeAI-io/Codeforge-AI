"use client";

import { useState } from "react";
import { Trophy, Loader2, Clock, ChevronDown, ChevronRight } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Problem { order: number; title: string; difficulty: string; category: string; description: string; examples: { input: string; output: string; explanation: string }[]; constraints: string[]; hint: string; points: number }
interface Contest { title: string; description: string; duration: number; problems: Problem[]; totalPoints: number; tags: string[] }

export function AiContestGenerator() {
  const [theme, setTheme] = useState("");
  const [difficulty, setDifficulty] = useState("Mixed");
  const [numQuestions, setNumQuestions] = useState("4");
  const [duration, setDuration] = useState("90");
  const [contest, setContest] = useState<Contest | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(1);

  async function generate() {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/contest-gen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme, difficulty, numQuestions: Number(numQuestions), duration: Number(duration) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setContest(data.contest);
      setExpanded(1);
    } catch { toast.error("Failed to generate contest"); }
    finally { setLoading(false); }
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Theme (optional)</Label>
          <Input value={theme} onChange={(e) => setTheme(e.target.value)} placeholder="e.g. Graph Algorithms, String Manipulation, DP Patterns..." />
        </div>
        <div className="space-y-1.5">
          <Label>Difficulty</Label>
          <Select value={difficulty} onValueChange={setDifficulty}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{["Mixed", "Easy", "Medium", "Hard"].map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Questions</Label>
          <Select value={numQuestions} onValueChange={setNumQuestions}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{[2,3,4,5,6].map((n) => <SelectItem key={n} value={String(n)}>{n} problems</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Duration (minutes)</Label>
          <Select value={duration} onValueChange={setDuration}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{[30,60,90,120,180].map((d) => <SelectItem key={d} value={String(d)}>{d} min</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <Button onClick={generate} disabled={loading} className="w-full">
        {loading ? <><Loader2 className="mr-2 size-4 animate-spin" />Generating contest...</> : <><Trophy className="mr-2 size-4" />Generate Contest</>}
      </Button>

      {contest && (
        <div className="space-y-4">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <h3 className="font-bold">{contest.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{contest.description}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="outline" className="gap-1.5"><Clock className="size-3" />{contest.duration} min</Badge>
                <Badge variant="outline">{contest.problems?.length} problems</Badge>
                <Badge variant="outline">{contest.totalPoints} pts total</Badge>
              </div>
              {contest.tags?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {contest.tags.map((t) => <span key={t} className="rounded bg-background/60 border px-2 py-0.5 text-[10px]">{t}</span>)}
                </div>
              )}
            </CardContent>
          </Card>

          {contest.problems?.map((problem) => (
            <Card key={problem.order} className={cn("cursor-pointer", expanded === problem.order && "border-primary/40")} onClick={() => setExpanded(expanded === problem.order ? null : problem.order)}>
              <CardHeader className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex size-6 items-center justify-center rounded bg-foreground text-[11px] font-bold text-background">{problem.order}</span>
                    <div>
                      <p className="text-sm font-semibold">{problem.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <DifficultyBadge difficulty={problem.difficulty} />
                        <span className="text-xs text-muted-foreground">{problem.category}</span>
                        <span className="text-xs font-semibold text-primary">{problem.points}pts</span>
                      </div>
                    </div>
                  </div>
                  {expanded === problem.order ? <ChevronDown className="size-4 text-muted-foreground" /> : <ChevronRight className="size-4 text-muted-foreground" />}
                </div>
              </CardHeader>
              {expanded === problem.order && (
                <CardContent className="pb-4 pt-0 px-4 space-y-3">
                  <p className="text-sm text-muted-foreground">{problem.description}</p>
                  {problem.examples?.slice(0, 2).map((ex, i) => (
                    <div key={i} className="rounded-lg bg-muted/50 p-3 font-mono text-xs space-y-1">
                      <p><span className="text-muted-foreground">Input:</span> {ex.input}</p>
                      <p><span className="text-muted-foreground">Output:</span> {ex.output}</p>
                      {ex.explanation && <p><span className="text-muted-foreground">Why:</span> {ex.explanation}</p>}
                    </div>
                  ))}
                  {problem.constraints?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Constraints</p>
                      {problem.constraints.map((c, i) => <p key={i} className="text-xs text-muted-foreground">• {c}</p>)}
                    </div>
                  )}
                  {problem.hint && <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-primary">💡 Hint: {problem.hint}</div>}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
