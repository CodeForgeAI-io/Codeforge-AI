"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowRight,
  CheckCircle2,
  Lightbulb,
  Loader2,
  Sparkles,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { DIFFICULTIES, QUESTION_CATEGORIES } from "@/lib/constants";

const ANY = "any";

const EXAMPLE_PROMPTS = [
  "Create questions about sliding window technique",
  "Binary search problems with tricky edge cases",
  "String manipulation questions asked at Google",
  "Beginner-friendly recursion warm-ups",
];

interface CreatedQuestion {
  slug: string;
  title: string;
  category: string;
  difficulty: string;
}

interface GenerateResult {
  created: CreatedQuestion[];
  rejected: { title: string; reason: string }[];
}

export function GenerateQuestions() {
  const [prompt, setPrompt] = useState("");
  const [count, setCount] = useState("3");
  const [category, setCategory] = useState(ANY);
  const [difficulty, setDifficulty] = useState(ANY);
  const [result, setResult] = useState<GenerateResult | null>(null);

  const mutation = useMutation({
    mutationFn: async (): Promise<GenerateResult> => {
      const res = await fetch("/api/ai/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          count: Number(count),
          ...(category !== ANY ? { category } : {}),
          ...(difficulty !== ANY ? { difficulty } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      return data;
    },
    onSuccess: (data) => {
      setResult(data);
      if (data.created.length > 0) {
        toast.success(
          `Created ${data.created.length} question(s) — they're live in Problems now!`,
        );
      } else {
        toast.error("The AI couldn't produce valid questions. Try rephrasing.");
      }
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <Sparkles className="size-6 text-primary" />
          Generate Questions
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Describe what you want to practice — the AI writes complete questions
          with test cases, hints and editorials, and publishes them to Problems.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">What do you want to practice?</CardTitle>
          <CardDescription>
            Be specific: topic, pattern, company style, or difficulty focus.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder='e.g. "Create questions about two pointers on sorted arrays"'
            rows={3}
            maxLength={600}
          />
          <div className="flex flex-wrap gap-1.5">
            {EXAMPLE_PROMPTS.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => setPrompt(example)}
                className="flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                <Lightbulb className="size-3" />
                {example}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="grid gap-1.5">
              <Label className="text-xs">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger size="sm" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ANY}>Any category</SelectItem>
                  {QUESTION_CATEGORIES.map((entry) => (
                    <SelectItem key={entry} value={entry}>
                      {entry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">Difficulty</Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger size="sm" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ANY}>Mixed</SelectItem>
                  {DIFFICULTIES.map((entry) => (
                    <SelectItem key={entry} value={entry}>
                      {entry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">How many</Label>
              <Select value={count} onValueChange={setCount}>
                <SelectTrigger size="sm" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} question{n > 1 ? "s" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            className="w-full"
            disabled={mutation.isPending || prompt.trim().length < 10}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Generating... this takes ~20–40 seconds
              </>
            ) : (
              <>
                <Sparkles className="size-4" /> Generate questions
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <div className="mt-6 space-y-3">
          {result.created.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">
                  Fresh from the forge ({result.created.length})
                </h2>
                <Button asChild variant="outline" size="sm">
                  <Link href="/problems">
                    View all problems <ArrowRight className="size-3.5" />
                  </Link>
                </Button>
              </div>
              <div className="overflow-hidden rounded-xl border">
                {result.created.map((question, index) => (
                  <Link
                    key={question.slug}
                    href={`/problems/${question.slug}`}
                    className={`flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/50 ${
                      index % 2 === 1 ? "bg-muted/30" : ""
                    }`}
                  >
                    <CheckCircle2 className="size-4 shrink-0 text-success" />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {question.title}
                    </span>
                    <Badge variant="secondary" className="text-[10px]">
                      {question.category}
                    </Badge>
                    <DifficultyBadge difficulty={question.difficulty} />
                    <span className="text-xs font-medium text-primary">
                      Solve now
                    </span>
                  </Link>
                ))}
              </div>
            </>
          )}
          {result.rejected.length > 0 && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3">
              <p className="mb-1.5 text-xs font-semibold text-destructive">
                Skipped ({result.rejected.length})
              </p>
              {result.rejected.map((rejection, index) => (
                <p key={index} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <XCircle className="mt-0.5 size-3 shrink-0 text-destructive" />
                  {rejection.title}: {rejection.reason}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
