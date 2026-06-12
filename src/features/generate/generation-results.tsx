"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";

export interface CreatedQuestion {
  slug: string;
  title: string;
  category: string;
  difficulty: string;
}

export interface GenerateResult {
  created: CreatedQuestion[];
  rejected: { title: string; reason: string }[];
}

/** Shared results list for AI generation and JSON uploads */
export function GenerationResults({ result }: { result: GenerateResult }) {
  return (
    <div className="space-y-3">
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
                <Badge variant="secondary" className="hidden text-[10px] sm:inline-flex">
                  {question.category}
                </Badge>
                <DifficultyBadge difficulty={question.difficulty} />
                <span className="hidden text-xs font-medium text-primary sm:inline">
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
            <p
              key={index}
              className="flex items-start gap-1.5 text-xs text-muted-foreground"
            >
              <XCircle className="mt-0.5 size-3 shrink-0 text-destructive" />
              {rejection.title}: {rejection.reason}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
