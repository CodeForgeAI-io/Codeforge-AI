"use client";

import { useState } from "react";
import { FileText, Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Analysis {
  atsScore: number;
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  missingKeywords: string[];
  suggestedKeywords: string[];
  improvements: { section: string; issue: string; suggestion: string }[];
  summary: string;
}

function ScoreRing({ score, label }: { score: number; label: string }) {
  const color = score >= 80 ? "text-easy" : score >= 60 ? "text-medium" : "text-destructive";
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={cn("text-3xl font-black", color)}>{score}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

export function AiResume() {
  const [resumeText, setResumeText] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);

  async function analyze() {
    if (!resumeText.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/ai/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, targetRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAnalysis(data.analysis);
    } catch {
      toast.error("Failed to analyze resume");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label>Target Role (optional)</Label>
          <Input
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            placeholder="e.g. Senior Frontend Engineer, Full Stack Developer"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Paste your resume text</Label>
          <Textarea
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            placeholder="Paste the full text content of your resume here..."
            className="min-h-[200px] font-mono text-xs"
          />
        </div>
        <Button onClick={analyze} disabled={loading || !resumeText.trim()} className="w-full">
          {loading ? <><Loader2 className="mr-2 size-4 animate-spin" /> Analyzing...</> : <><FileText className="mr-2 size-4" /> Analyze Resume</>}
        </Button>
      </div>

      {analysis && (
        <div className="space-y-4">
          <Card className="border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-around">
                <ScoreRing score={analysis.atsScore} label="ATS Score" />
                <div className="h-12 w-px bg-border" />
                <ScoreRing score={analysis.overallScore} label="Overall Score" />
              </div>
              <Progress value={analysis.overallScore} className="mt-4 h-2" />
              <p className="mt-3 text-sm text-muted-foreground">{analysis.summary}</p>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm text-easy">
                  <CheckCircle2 className="size-4" /> Strengths
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {analysis.strengths?.map((s, i) => (
                  <p key={i} className="text-xs text-muted-foreground">✓ {s}</p>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm text-destructive">
                  <XCircle className="size-4" /> Weaknesses
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {analysis.weaknesses?.map((s, i) => (
                  <p key={i} className="text-xs text-muted-foreground">✗ {s}</p>
                ))}
              </CardContent>
            </Card>
          </div>

          {analysis.missingKeywords?.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Missing Keywords</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {analysis.missingKeywords.map((k) => (
                    <span key={k} className="rounded-full border border-destructive/30 bg-destructive/10 px-2.5 py-0.5 text-xs text-destructive">{k}</span>
                  ))}
                </div>
                {analysis.suggestedKeywords?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {analysis.suggestedKeywords.map((k) => (
                      <span key={k} className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs text-primary">{k}</span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {analysis.improvements?.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Improvements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {analysis.improvements.map((imp, i) => (
                  <div key={i} className="rounded-lg border px-3 py-2.5">
                    <p className="text-xs font-semibold text-primary">{imp.section}</p>
                    <p className="text-xs text-destructive mt-0.5">{imp.issue}</p>
                    <p className="text-xs text-muted-foreground mt-1">→ {imp.suggestion}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
