"use client";

import { useState } from "react";
import { BarChart2, Loader2, Zap, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const COMPLEXITY_ORDER = ["O(1)", "O(log n)", "O(n)", "O(n log n)", "O(n²)", "O(2ⁿ)", "O(n!)"];
const COMPLEXITY_COLORS: Record<string, string> = {
  "O(1)": "text-easy border-easy/40 bg-easy/10",
  "O(log n)": "text-easy border-easy/30 bg-easy/5",
  "O(n)": "text-medium border-medium/40 bg-medium/10",
  "O(n log n)": "text-medium border-medium/30 bg-medium/5",
  "O(n²)": "text-hard border-hard/40 bg-hard/10",
  "O(2ⁿ)": "text-hard border-hard/50 bg-hard/15",
  "O(n!)": "text-hard border-hard/60 bg-hard/20",
};
const LANGUAGES = ["javascript", "typescript", "python", "java", "c++", "c", "go", "rust"];

interface Analysis {
  timeComplexity: string; spaceComplexity: string;
  timeBreakdown: { line: string; complexity: string; explanation: string }[];
  loops: { description: string; complexity: string }[];
  bestCase: string; worstCase: string; averageCase: string;
  canBeOptimized: boolean; optimizationHint: string;
  comparison: { vs_brute_force: string; optimal: string };
  explanation: string;
}

function ComplexityBadge({ complexity }: { complexity: string }) {
  const key = Object.keys(COMPLEXITY_COLORS).find((k) => complexity?.includes(k.replace("ⁿ", "^n").replace("²", "^2")) || complexity === k) ?? "";
  return (
    <span className={cn("inline-flex items-center rounded-lg border px-3 py-1 text-sm font-bold font-mono", COMPLEXITY_COLORS[key] ?? "bg-muted text-foreground border-border")}>
      {complexity}
    </span>
  );
}

export function AiComplexityVisualizer() {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);

  async function analyze() {
    if (!code.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/ai/complexity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAnalysis(data.analysis);
    } catch { toast.error("Failed to analyze complexity"); }
    finally { setLoading(false); }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>{LANGUAGES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
        </Select>
        <Button onClick={analyze} disabled={loading || !code.trim()} className="ml-auto">
          {loading ? <><Loader2 className="mr-2 size-4 animate-spin" />Analyzing...</> : <><BarChart2 className="mr-2 size-4" />Analyze Complexity</>}
        </Button>
      </div>
      <Textarea value={code} onChange={(e) => setCode(e.target.value)} placeholder="Paste your code to analyze time and space complexity..." className="font-mono text-xs min-h-[160px]" />

      {analysis && (
        <div className="space-y-4">
          <Card className="border-primary/20">
            <CardContent className="p-5">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2 text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Time Complexity</p>
                  <ComplexityBadge complexity={analysis.timeComplexity} />
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <p>Best: {analysis.bestCase}</p>
                    <p>Avg: {analysis.averageCase}</p>
                    <p>Worst: {analysis.worstCase}</p>
                  </div>
                </div>
                <div className="space-y-2 text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Space Complexity</p>
                  <ComplexityBadge complexity={analysis.spaceComplexity} />
                  <div className="flex items-center justify-center gap-1.5 text-xs">
                    {analysis.canBeOptimized ? (
                      <><AlertTriangle className="size-3 text-medium" /><span className="text-medium">Can be optimized</span></>
                    ) : (
                      <><CheckCircle2 className="size-3 text-easy" /><span className="text-easy">Optimal solution</span></>
                    )}
                  </div>
                </div>
              </div>
              <p className="mt-4 text-sm text-muted-foreground text-center">{analysis.explanation}</p>
            </CardContent>
          </Card>

          {analysis.loops?.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Loop Analysis</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {analysis.loops.map((loop, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                    <p className="text-xs">{loop.description}</p>
                    <ComplexityBadge complexity={loop.complexity} />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {analysis.canBeOptimized && analysis.optimizationHint && (
            <Card className="border-medium/30 bg-medium/5">
              <CardContent className="flex gap-3 p-4">
                <Zap className="size-4 text-medium shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-medium">Optimization Available</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{analysis.optimizationHint}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {(analysis.comparison?.vs_brute_force || analysis.comparison?.optimal) && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Comparison</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-xs">
                {analysis.comparison.vs_brute_force && <p><span className="text-muted-foreground">vs Brute Force:</span> {analysis.comparison.vs_brute_force}</p>}
                {analysis.comparison.optimal && <p><span className="text-muted-foreground">Optimal approach:</span> {analysis.comparison.optimal}</p>}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
