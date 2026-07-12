"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Play,
  RotateCcw,
  Sparkles,
} from "@/components/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DisplayTestResult } from "./test-results";
import type { ArrayVisualization, RunVizResponse } from "@/lib/visualization";

export function RunVisualizer({
  slug,
  code,
  language,
  results,
  signedIn,
}: {
  slug: string;
  code: string;
  language: string;
  results: DisplayTestResult[];
  signedIn: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<RunVizResponse | null>(null);

  const hasRun = results.length > 0;
  // Prefer the first failing case so the animation shows what went wrong.
  const target = useMemo(
    () => results.find((r) => r.passed === false) ?? results[0] ?? null,
    [results],
  );

  async function visualize() {
    if (!target) return;
    setLoading(true);
    setData(null);
    try {
      const res = await fetch(`/api/problems/${slug}/visualize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          language,
          test: {
            input: target.input,
            expected: target.expected,
            actual: target.actual,
            passed: target.passed === true,
          },
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Visualization failed");
      setData(json as RunVizResponse);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Visualization failed");
    } finally {
      setLoading(false);
    }
  }

  if (!signedIn) {
    return <Empty icon={Sparkles}>Sign in to visualize your solution running step by step.</Empty>;
  }
  if (!hasRun) {
    return <Empty icon={Play}>Run your code, then visualize exactly how it processes the test case.</Empty>;
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto p-3">
      {!data && (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
          <p className="max-w-xs text-sm text-muted-foreground">
            Animate your run on {target?.passed === false ? "the failing test case" : "the sample test case"} and see
            what your code does — right or wrong.
          </p>
          <Button onClick={visualize} disabled={loading} className="gap-1.5">
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {loading ? "Analyzing your run…" : "Visualize this run"}
          </Button>
        </div>
      )}

      {data && (
        <div className="space-y-3">
          <Verdict data={data} />
          {data.visualization.kind === "array" ? (
            <ArrayPlayer viz={data.visualization} />
          ) : (
            <p className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
              {data.visualization.reason}
            </p>
          )}
          <Button variant="outline" size="sm" onClick={visualize} disabled={loading} className="gap-1.5">
            {loading ? <Loader2 className="size-4 animate-spin" /> : <RotateCcw className="size-4" />}
            Re-run visualization
          </Button>
        </div>
      )}
    </div>
  );
}

function Verdict({ data }: { data: RunVizResponse }) {
  const correct = data.verdict === "correct";
  return (
    <div
      className={cn(
        "flex gap-2.5 rounded-lg border p-3",
        correct ? "border-success/30 bg-success/5" : "border-destructive/40 bg-destructive/5",
      )}
    >
      <span className={cn("mt-0.5 shrink-0", correct ? "text-success" : "text-destructive")}>
        {correct ? <Check className="size-4" /> : <AlertTriangle className="size-4" />}
      </span>
      <div>
        <p className={cn("text-sm font-semibold", correct ? "text-success" : "text-destructive")}>
          {correct ? "Correct — here's how it works" : "Not quite — here's what went wrong"}
        </p>
        <p className="mt-0.5 text-xs leading-relaxed text-foreground/80">{data.feedback}</p>
      </div>
    </div>
  );
}

function ArrayPlayer({ viz }: { viz: ArrayVisualization }) {
  const [cur, setCur] = useState(0);
  const [playing, setPlaying] = useState(true);
  const last = viz.steps.length - 1;
  const step = viz.steps[Math.min(cur, last)];

  const next = useCallback(() => setCur((c) => Math.min(c + 1, last)), [last]);
  const prev = useCallback(() => setCur((c) => Math.max(c - 1, 0)), []);
  const restart = useCallback(() => { setCur(0); setPlaying(true); }, []);

  useEffect(() => {
    if (!playing) return;
    if (cur >= last) { setPlaying(false); return; }
    const t = setTimeout(() => setCur((c) => c + 1), 900);
    return () => clearTimeout(t);
  }, [playing, cur, last]);

  // Numeric arrays render as height-scaled bars; otherwise as value cells.
  const numeric = step.array.every((v) => typeof v === "number");
  const maxAbs = Math.max(1, ...step.array.map((v) => (typeof v === "number" ? Math.abs(v) : 0)));

  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="mb-2 text-xs font-medium text-muted-foreground">{viz.title}</p>

      {/* stage */}
      <div className="flex min-h-44 items-end justify-center gap-1.5 overflow-x-auto rounded-md bg-muted/20 p-3">
        {step.array.map((val, i) => {
          const active = step.highlight.includes(i);
          const ptrs = step.pointers.filter((p) => p.index === i);
          const h = numeric ? 24 + (Math.abs(Number(val)) / maxAbs) * 110 : 44;
          return (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="flex h-4 items-end gap-0.5">
                {ptrs.map((p) => (
                  <span key={p.label} className="rounded bg-primary px-1 text-[9px] font-bold leading-4 text-primary-foreground">
                    {p.label}
                  </span>
                ))}
              </div>
              <motion.div
                layout
                animate={{ height: h }}
                transition={{ type: "spring", stiffness: 300, damping: 26 }}
                className={cn(
                  "flex w-8 items-start justify-center rounded-md pt-1 text-[11px] font-semibold tabular-nums",
                  active ? "bg-primary text-primary-foreground" : "bg-primary/15 text-foreground",
                )}
                style={{ height: h }}
              >
                {String(val)}
              </motion.div>
              <span className="text-[9px] text-muted-foreground">{i}</span>
            </div>
          );
        })}
      </div>

      {/* note */}
      <p className="mt-2 min-h-8 rounded-md bg-muted/30 px-3 py-1.5 text-xs leading-relaxed text-foreground/80">
        {step.note || " "}
      </p>

      {/* controls */}
      <div className="mt-2 flex items-center gap-1">
        <Button variant="ghost" size="icon" className="size-8" onClick={restart} title="Restart">
          <RotateCcw className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" className="size-8" onClick={() => { setPlaying(false); prev(); }} disabled={cur === 0} title="Previous step">
          <ChevronLeft className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" className="size-8" onClick={() => (cur >= last ? restart() : setPlaying((p) => !p))} title={playing ? "Pause" : "Play"}>
          {playing ? <PauseGlyph /> : <Play className="size-4" />}
        </Button>
        <Button variant="ghost" size="icon" className="size-8" onClick={() => { setPlaying(false); next(); }} disabled={cur >= last} title="Next step">
          <ChevronRight className="size-4" />
        </Button>
        <span className="ml-1 text-xs tabular-nums text-muted-foreground">
          {Math.min(cur + 1, viz.steps.length)} / {viz.steps.length}
        </span>
      </div>
    </div>
  );
}

function PauseGlyph() {
  return (
    <span className="flex gap-[3px]" aria-hidden="true">
      <span className="h-3.5 w-1 rounded-sm bg-current" />
      <span className="h-3.5 w-1 rounded-sm bg-current" />
    </span>
  );
}

function Empty({ icon: Icon, children }: { icon: typeof Play; children: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
      <Icon className="size-6 text-muted-foreground/60" />
      <p className="max-w-xs text-sm text-muted-foreground">{children}</p>
    </div>
  );
}
