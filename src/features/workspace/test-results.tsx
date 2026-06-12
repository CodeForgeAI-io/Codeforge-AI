"use client";

import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export interface DisplayTestResult {
  input: string;
  expected: string | null;
  actual: string;
  passed: boolean | null;
  stderr?: string;
  hidden?: boolean;
  timeMs?: number | null;
}

interface TestResultsProps {
  running: boolean;
  status: string | null;
  results: DisplayTestResult[];
  passedCount: number;
  totalCount: number;
  custom?: boolean;
}

export function TestResults({
  running,
  status,
  results,
  passedCount,
  totalCount,
  custom = false,
}: TestResultsProps) {
  if (running) {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Running your code in the sandbox...
      </div>
    );
  }

  if (!status && results.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Run your code to see test results here.
      </div>
    );
  }

  const allPassed = status === "Accepted" || (totalCount > 0 && passedCount === totalCount);

  return (
    <ScrollArea className="h-full">
      <div className="space-y-3 p-3">
        {status && (
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-base font-semibold",
                allPassed ? "text-success" : "text-destructive",
              )}
            >
              {status}
            </span>
            {!custom && totalCount > 0 && (
              <Badge variant="secondary">
                {passedCount}/{totalCount} tests passed
              </Badge>
            )}
          </div>
        )}
        {results.map((result, index) => (
          <div
            key={index}
            className={cn(
              "rounded-lg border p-3",
              result.passed === false && "border-destructive/40 bg-destructive/5",
              result.passed === true && "border-success/30 bg-success/5",
            )}
          >
            <div className="mb-2 flex items-center gap-2 text-sm font-medium">
              {result.passed === true && (
                <CheckCircle2 className="size-4 text-success" />
              )}
              {result.passed === false && (
                <XCircle className="size-4 text-destructive" />
              )}
              {custom ? "Custom input" : `Test case ${index + 1}`}
              {result.hidden && (
                <Badge variant="outline" className="text-[10px]">
                  hidden
                </Badge>
              )}
              {typeof result.timeMs === "number" && (
                <span className="ml-auto text-xs text-muted-foreground">
                  {result.timeMs} ms
                </span>
              )}
            </div>
            {!result.hidden && (
              <div className="grid gap-2 font-mono text-xs">
                <Field label="Input" value={result.input} />
                {result.expected !== null && (
                  <Field label="Expected" value={result.expected} />
                )}
                <Field label="Output" value={result.actual || "(empty)"} />
                {result.stderr && (
                  <Field label="Stderr" value={result.stderr} error />
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

function Field({
  label,
  value,
  error = false,
}: {
  label: string;
  value: string;
  error?: boolean;
}) {
  return (
    <div>
      <p className="mb-0.5 text-[10px] font-sans uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <pre
        className={cn(
          "max-h-40 overflow-auto whitespace-pre-wrap rounded-md bg-muted/60 p-2",
          error && "text-destructive",
        )}
      >
        {value}
      </pre>
    </div>
  );
}
