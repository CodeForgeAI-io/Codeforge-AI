"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ChevronDown, Lightbulb, Lock } from "@/components/icons";
import { Markdown } from "@/components/shared/markdown";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EditorialVideos } from "@/features/workspace/editorial-videos";
import { cn } from "@/lib/utils";
import type { QuestionDetail } from "@/services/questions";

export function QuestionPanel({ question }: { question: QuestionDetail }) {
  return (
    <Tabs defaultValue="description" className="flex h-full flex-col gap-0">
      <TabsList className="m-2 w-fit">
        <TabsTrigger value="description">Description</TabsTrigger>
        <TabsTrigger value="editorial">Editorial</TabsTrigger>
        <TabsTrigger value="submissions">Submissions</TabsTrigger>
      </TabsList>

      <TabsContent value="description" className="min-h-0 flex-1">
        <ScrollArea className="h-full">
          <div className="space-y-4 p-4 pt-2">
            <div>
              <h1 className="text-lg font-semibold">{question.title}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <DifficultyBadge difficulty={question.difficulty} />
                <Badge variant="secondary">{question.category}</Badge>
                {question.acceptanceRate !== null && (
                  <span className="text-xs text-muted-foreground">
                    {question.acceptanceRate}% acceptance
                  </span>
                )}
              </div>
            </div>

            <Markdown>{question.description}</Markdown>

            {question.examples.map((example, index) => (
              <div key={index} className="rounded-lg border bg-muted/30 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Example {index + 1}
                </p>
                <div className="space-y-1.5 font-mono text-xs">
                  <p>
                    <span className="text-muted-foreground">Input: </span>
                    {example.input}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Output: </span>
                    {example.output}
                  </p>
                  {example.explanation && (
                    <p className="font-sans text-muted-foreground">
                      {example.explanation}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {question.constraints.length > 0 && (
              <div>
                <p className="mb-1.5 text-sm font-semibold">Constraints</p>
                <ul className="list-disc space-y-1 pl-5 font-mono text-xs text-muted-foreground">
                  {question.constraints.map((constraint, index) => (
                    <li key={index}>{constraint}</li>
                  ))}
                </ul>
              </div>
            )}

            {question.hints.length > 0 && <Hints hints={question.hints} />}

            {question.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 border-t pt-3">
                {question.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-[10px]">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </TabsContent>

      <TabsContent value="editorial" className="min-h-0 flex-1">
        <ScrollArea className="h-full">
          <div className="space-y-5 p-4 pt-2">
            {question.editorial ? (
              <Markdown>{question.editorial}</Markdown>
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No written editorial for this question yet. Ask the AI mentor to
                explain the approach — or learn it from a video below.
              </p>
            )}
            <EditorialVideos slug={question.slug} title={question.title} />
          </div>
        </ScrollArea>
      </TabsContent>

      <TabsContent value="submissions" className="min-h-0 flex-1">
        <SubmissionsTab questionId={question.id} />
      </TabsContent>
    </Tabs>
  );
}

function Hints({ hints }: { hints: string[] }) {
  const [revealed, setRevealed] = useState(0);

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold">Hints</p>
      {hints.slice(0, revealed).map((hint, index) => (
        <div
          key={index}
          className="flex gap-2 rounded-lg border border-warning/30 bg-warning/5 p-3 text-sm"
        >
          <Lightbulb className="size-4 shrink-0 text-warning" />
          <span>{hint}</span>
        </div>
      ))}
      {revealed < hints.length && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setRevealed((count) => count + 1)}
        >
          <Lock className="size-3.5" />
          Reveal hint {revealed + 1} of {hints.length}
        </Button>
      )}
    </div>
  );
}

interface SubmissionRow {
  id: string;
  status: string;
  language: string;
  passedCount: number;
  totalCount: number;
  runtimeMs: number | null;
  createdAt: string;
  code?: string;
}

function SubmissionsTab({ questionId }: { questionId: string }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const { data, isLoading } = useQuery<{ submissions: SubmissionRow[] }>({
    queryKey: ["submissions", questionId],
    queryFn: async () => {
      const res = await fetch(`/api/submissions?questionId=${questionId}`);
      if (!res.ok) throw new Error("Failed to load submissions");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Loading submissions...
      </p>
    );
  }

  const submissions = data?.submissions ?? [];
  if (submissions.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        No submissions yet. Submit your solution to see it here.
      </p>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-2 p-3">
        {submissions.map((submission) => (
          <div key={submission.id} className="rounded-lg border">
            <button
              className="flex w-full items-center gap-2 p-3 text-left"
              onClick={() =>
                setExpanded(expanded === submission.id ? null : submission.id)
              }
            >
              <span
                className={cn(
                  "text-sm font-medium",
                  submission.status === "Accepted"
                    ? "text-success"
                    : "text-destructive",
                )}
              >
                {submission.status}
              </span>
              <Badge variant="outline" className="text-[10px]">
                {submission.language}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {submission.passedCount}/{submission.totalCount}
              </span>
              <span className="ml-auto text-xs text-muted-foreground">
                {format(new Date(submission.createdAt), "MMM d, HH:mm")}
              </span>
              <ChevronDown
                className={cn(
                  "size-4 text-muted-foreground transition-transform",
                  expanded === submission.id && "rotate-180",
                )}
              />
            </button>
            {expanded === submission.id && submission.code && (
              <pre className="max-h-64 overflow-auto border-t bg-muted/40 p-3 font-mono text-xs">
                {submission.code}
              </pre>
            )}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
