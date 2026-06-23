"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const LANGUAGES = ["javascript", "typescript", "python", "java", "c++", "c", "go", "rust", "kotlin", "swift"];

interface Review {
  correctness: number;
  readability: number;
  performance: number;
  bestPractices: number;
  overall: number;
  timeComplexity: string;
  spaceComplexity: string;
  feedback: string;
  improvements: string[];
  positives: string[];
}

function ScoreCircle({ score, label }: { score: number; label: string }) {
  const color = score >= 8 ? "text-easy" : score >= 6 ? "text-medium" : "text-destructive";
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={cn("text-2xl font-black", color)}>{score}<span className="text-base font-normal text-muted-foreground">/10</span></div>
      <div className="text-[10px] text-muted-foreground text-center">{label}</div>
    </div>
  );
}

export function AiCodeReview({ initialCode, initialLanguage }: { initialCode?: string; initialLanguage?: string } = {}) {
  const [code, setCode] = useState(initialCode ?? "");
  const [language, setLanguage] = useState(initialLanguage ?? "javascript");
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!code.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/ai/code-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setReview(data.review);
    } catch {
      toast.error("Failed to review code");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={submit} disabled={loading || !code.trim()} className="ml-auto">
          {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Sparkles className="mr-2 size-4" />}
          {loading ? "Reviewing..." : "Review Code"}
        </Button>
      </div>

      <Textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Paste your solution code here..."
        className="min-h-50 font-mono text-xs"
      />

      {review && (
        <div className="space-y-4">
          <Card className="border-primary/20">
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-4 gap-4 divide-x">
                <ScoreCircle score={review.correctness} label="Correctness" />
                <ScoreCircle score={review.readability} label="Readability" />
                <ScoreCircle score={review.performance} label="Performance" />
                <ScoreCircle score={review.bestPractices} label="Best Practices" />
              </div>
              <div className="flex gap-4 justify-center text-xs text-muted-foreground border-t pt-3">
                <span>Time: <strong className="text-foreground">{review.timeComplexity}</strong></span>
                <span>Space: <strong className="text-foreground">{review.spaceComplexity}</strong></span>
              </div>
            </CardContent>
          </Card>

          <p className="text-sm text-muted-foreground">{review.feedback}</p>

          {review.positives?.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-easy">What&apos;s Good</CardTitle></CardHeader>
              <CardContent className="space-y-1">
                {review.positives.map((p, i) => <p key={i} className="text-xs text-muted-foreground">✓ {p}</p>)}
              </CardContent>
            </Card>
          )}

          {review.improvements?.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-medium">Improvements</CardTitle></CardHeader>
              <CardContent className="space-y-1">
                {review.improvements.map((p, i) => <p key={i} className="text-xs text-muted-foreground">→ {p}</p>)}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
