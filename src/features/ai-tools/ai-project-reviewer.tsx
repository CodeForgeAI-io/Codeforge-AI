"use client";

import { useState } from "react";
import { GitBranch, Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Issue {
  severity: "high" | "medium" | "low";
  area: string;
  issue: string;
  suggestion: string;
}

interface Review {
  codeQualityScore: number;
  architectureScore: number;
  documentationScore: number;
  overallScore: number;
  strengths: string[];
  issues: Issue[];
  recommendations: string[];
  securityConcerns: string[];
  summary: string;
}

const SEVERITY_STYLES: Record<string, string> = {
  high: "border-destructive/40 bg-destructive/5",
  medium: "border-medium/40 bg-medium/5",
  low: "border-muted-foreground/20 bg-muted/30",
};

function ScoreBar({ label, score }: { label: string; score: number }) {
  const color = score >= 80 ? "[&>div]:bg-easy" : score >= 60 ? "[&>div]:bg-medium" : "[&>div]:bg-destructive";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{score}/100</span>
      </div>
      <div className={cn("h-2 overflow-hidden rounded-full bg-muted", color)}>
        <div className="h-full rounded-full transition-all" style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

export function AiProjectReviewer() {
  const [repoUrl, setRepoUrl] = useState("");
  const [description, setDescription] = useState("");
  const [techStack, setTechStack] = useState("");
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!repoUrl.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/ai/project-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl, description, techStack }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setReview(data.review);
    } catch {
      toast.error("Failed to review project");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label>GitHub Repository URL</Label>
          <Input
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="https://github.com/username/repo"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Tech Stack (optional)</Label>
          <Input
            value={techStack}
            onChange={(e) => setTechStack(e.target.value)}
            placeholder="e.g. React, Node.js, PostgreSQL"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Description (optional)</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of your project..."
            className="min-h-20"
          />
        </div>
        <Button onClick={submit} disabled={loading || !repoUrl.trim()} className="w-full">
          {loading ? <><Loader2 className="mr-2 size-4 animate-spin" /> Reviewing...</> : <><GitBranch className="mr-2 size-4" /> Review Project</>}
        </Button>
      </div>

      {review && (
        <div className="space-y-4">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4 space-y-3">
              <div className="text-center">
                <span className={cn("text-4xl font-black", review.overallScore >= 80 ? "text-easy" : review.overallScore >= 60 ? "text-medium" : "text-destructive")}>
                  {review.overallScore}
                </span>
                <span className="text-muted-foreground text-lg">/100</span>
                <p className="text-xs text-muted-foreground mt-0.5">Overall Score</p>
              </div>
              <div className="space-y-2">
                <ScoreBar label="Code Quality" score={review.codeQualityScore} />
                <ScoreBar label="Architecture" score={review.architectureScore} />
                <ScoreBar label="Documentation" score={review.documentationScore} />
              </div>
              <p className="text-sm text-muted-foreground">{review.summary}</p>
            </CardContent>
          </Card>

          {review.issues?.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Issues Found</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {review.issues.map((issue, i) => (
                  <div key={i} className={cn("rounded-lg border px-3 py-2.5", SEVERITY_STYLES[issue.severity])}>
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-xs font-semibold">{issue.area}</p>
                      <span className="text-[10px] uppercase font-bold tracking-wide text-muted-foreground">{issue.severity}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{issue.issue}</p>
                    <p className="text-xs text-primary mt-1">→ {issue.suggestion}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {review.securityConcerns?.length > 0 && (
            <Card className="border-destructive/30">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm text-destructive">
                  <ShieldAlert className="size-4" /> Security Concerns
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {review.securityConcerns.map((s, i) => (
                  <p key={i} className="text-xs text-muted-foreground">⚠ {s}</p>
                ))}
              </CardContent>
            </Card>
          )}

          {review.recommendations?.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Recommendations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {review.recommendations.map((r, i) => (
                  <p key={i} className="text-xs text-muted-foreground">• {r}</p>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
