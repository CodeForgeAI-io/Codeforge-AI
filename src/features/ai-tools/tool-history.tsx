"use client";

import { useCallback, useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Clock, RotateCcw, Loader2, ChevronDown } from "@/components/icons";
import { cn } from "@/lib/utils";

export interface ToolRun<T = unknown> {
  id: string;
  title: string;
  result: T;
  createdAt: string;
}

/**
 * Save (or update) an AI tool run to history.
 * Pass `id` to update an existing run (e.g. a chat session); returns the run id.
 */
export async function saveToolRun(args: {
  tool: string;
  title: string;
  result: unknown;
  input?: unknown;
  id?: string | null;
}): Promise<string | null> {
  try {
    const res = await fetch("/api/ai/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(args),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.id ?? null;
  } catch {
    return null;
  }
}

/** Collapsible "Recent" list for an AI tool — reloads a past result via onLoad. */
export function ToolHistory<T = unknown>({
  tool,
  refreshKey = 0,
  onLoad,
}: {
  tool: string;
  refreshKey?: number;
  onLoad: (result: T) => void;
}) {
  const [runs, setRuns] = useState<ToolRun<T>[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/ai/history?tool=${encodeURIComponent(tool)}`);
      if (res.ok) {
        const data = await res.json();
        setRuns(data.runs ?? []);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [tool]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  if (runs.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-3 py-2 text-sm font-medium transition-colors hover:bg-accent/40"
      >
        <Clock className="size-4 text-muted-foreground" />
        Recent
        <span className="rounded-full bg-muted px-1.5 text-xs text-muted-foreground">
          {runs.length}
        </span>
        {loading && <Loader2 className="size-3.5 animate-spin text-muted-foreground" />}
        <ChevronDown
          className={cn("ml-auto size-4 text-muted-foreground transition-transform", open && "rotate-180")}
        />
      </button>
      {open && (
        <ul className="max-h-64 overflow-y-auto border-t">
          {runs.map((run) => (
            <li key={run.id}>
              <button
                type="button"
                onClick={() => onLoad(run.result)}
                className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-accent/50"
              >
                <RotateCcw className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate">{run.title}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(run.createdAt), { addSuffix: true })}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
