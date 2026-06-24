"use client";

import { useState } from "react";
import { CalendarDays, Loader2, ChevronDown, ChevronRight, Target, CheckCircle2 } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ToolHistory, saveToolRun } from "./tool-history";

interface DailyTask { day: string; task: string; type: "theory" | "practice" | "review"; mins: number }
interface Week { week: number; theme: string; topics: string[]; dailyTasks: DailyTask[]; goal: string }
interface Plan { title: string; totalWeeks: number; hoursPerDay: number; weeks: Week[]; tips: string[]; milestones: { week: number; milestone: string }[] }

const TYPE_COLORS = { theory: "bg-blue-500/10 text-blue-600 border-blue-500/20", practice: "bg-primary/10 text-primary border-primary/20", review: "bg-purple-500/10 text-purple-600 border-purple-500/20" };

export function AiStudyPlanner() {
  const [goal, setGoal] = useState("");
  const [weeks, setWeeks] = useState("4");
  const [hours, setHours] = useState("2");
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(1);
  const [historyKey, setHistoryKey] = useState(0);

  async function generate() {
    if (!goal.trim()) { toast.error("Enter your goal"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/ai/study-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal, weeks: Number(weeks), hoursPerDay: Number(hours) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPlan(data.plan);
      setExpanded(1);
      await saveToolRun({ tool: "study", title: goal, result: data.plan, input: { goal, weeks, hours } });
      setHistoryKey((k) => k + 1);
    } catch { toast.error("Failed to generate plan"); }
    finally { setLoading(false); }
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <div className="space-y-1.5">
          <Label>Your Goal</Label>
          <Input value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="e.g. Crack FAANG in 3 months, SDE-2 at Amazon..." onKeyDown={(e) => e.key === "Enter" && generate()} />
        </div>
        <div className="space-y-1.5">
          <Label>Weeks</Label>
          <Select value={weeks} onValueChange={setWeeks}><SelectTrigger className="w-24"><SelectValue /></SelectTrigger><SelectContent>{[2,4,6,8,12].map((w) => <SelectItem key={w} value={String(w)}>{w} wks</SelectItem>)}</SelectContent></Select>
        </div>
        <div className="space-y-1.5">
          <Label>Hours/day</Label>
          <Select value={hours} onValueChange={setHours}><SelectTrigger className="w-24"><SelectValue /></SelectTrigger><SelectContent>{[1,2,3,4,6].map((h) => <SelectItem key={h} value={String(h)}>{h}h</SelectItem>)}</SelectContent></Select>
        </div>
      </div>
      <Button onClick={generate} disabled={loading || !goal.trim()} className="w-full">
        {loading ? <><Loader2 className="mr-2 size-4 animate-spin" />Generating your plan...</> : <><CalendarDays className="mr-2 size-4" />Generate Study Plan</>}
      </Button>

      <ToolHistory tool="study" refreshKey={historyKey} onLoad={(r) => setPlan(r as Plan)} />

      {plan && (
        <div className="space-y-4">
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4">
              <h3 className="font-bold text-base">{plan.title}</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant="outline">{plan.totalWeeks} weeks</Badge>
                <Badge variant="outline">{plan.hoursPerDay}h/day</Badge>
              </div>
              {plan.milestones?.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {plan.milestones.map((m) => (
                    <div key={m.week} className="flex items-center gap-2 text-xs">
                      <Target className="size-3 text-primary shrink-0" />
                      <span className="text-muted-foreground">Week {m.week}:</span>
                      <span>{m.milestone}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {plan.weeks?.map((week) => (
            <Card key={week.week} className={cn("cursor-pointer transition-colors", expanded === week.week && "border-primary/40")} onClick={() => setExpanded(expanded === week.week ? null : week.week)}>
              <CardHeader className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex size-7 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background">W{week.week}</span>
                    <div>
                      <p className="text-sm font-semibold">{week.theme}</p>
                      <p className="text-xs text-muted-foreground">{week.goal}</p>
                    </div>
                  </div>
                  {expanded === week.week ? <ChevronDown className="size-4 text-muted-foreground" /> : <ChevronRight className="size-4 text-muted-foreground" />}
                </div>
              </CardHeader>
              {expanded === week.week && (
                <CardContent className="pb-4 pt-0 px-4 space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                    {week.topics?.map((t) => <span key={t} className="rounded bg-muted px-2 py-0.5 text-xs">{t}</span>)}
                  </div>
                  <div className="space-y-1.5">
                    {week.dailyTasks?.map((task) => (
                      <div key={task.day} className="flex items-start gap-3 rounded-lg border px-3 py-2">
                        <span className="text-xs font-bold text-muted-foreground w-6 shrink-0">{task.day.slice(0,3)}</span>
                        <p className="flex-1 text-xs">{task.task}</p>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={cn("rounded border px-1.5 py-0.5 text-[10px] font-medium", TYPE_COLORS[task.type])}>{task.type}</span>
                          <span className="text-[10px] text-muted-foreground">{task.mins}m</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}

          {plan.tips?.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Study Tips</CardTitle></CardHeader>
              <CardContent className="space-y-1.5">
                {plan.tips.map((t, i) => <div key={i} className="flex gap-2 text-xs"><CheckCircle2 className="size-3.5 text-primary shrink-0 mt-0.5" /><span className="text-muted-foreground">{t}</span></div>)}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
