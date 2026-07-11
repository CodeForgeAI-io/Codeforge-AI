"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, FileText, ChevronRight } from "@/components/icons";
import { Input } from "@/components/ui/input";
import type { DocSearchItem } from "@/content/docs";
import { cn } from "@/lib/utils";

function score(item: DocSearchItem, q: string): number {
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  const hay = `${item.title} ${item.description} ${item.tags.join(" ")} ${item.categoryTitle}`.toLowerCase();
  const title = item.title.toLowerCase();
  let s = 0;
  for (const t of terms) {
    if (!hay.includes(t)) return 0; // every term must appear
    if (title.includes(t)) s += 3;
    if (item.tags.some((tag) => tag.toLowerCase().includes(t))) s += 2;
    s += 1;
  }
  return s;
}

export function DocsSearch({
  index,
  autoFocus = false,
  placeholder = "Search the docs…",
}: {
  index: DocSearchItem[];
  autoFocus?: boolean;
  placeholder?: string;
}) {
  const [q, setQ] = useState("");

  const results = useMemo(() => {
    const query = q.trim();
    if (!query) return [];
    return index
      .map((item) => ({ item, s: score(item, query) }))
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 8)
      .map((r) => r.item);
  }, [q, index]);

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
         
        autoFocus={autoFocus}
        placeholder={placeholder}
        aria-label="Search documentation"
        className="h-12 pl-10 text-base"
      />

      {q.trim() && (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border bg-popover shadow-lg">
          {results.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              No results for &ldquo;{q}&rdquo;. Try a different term.
            </p>
          ) : (
            <ul className="max-h-[60vh] overflow-y-auto py-1">
              {results.map((r) => (
                <li key={r.slug}>
                  <Link
                    href={`/help/${r.slug}`}
                    className={cn(
                      "flex items-start gap-3 px-4 py-2.5 transition-colors hover:bg-accent",
                    )}
                  >
                    <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium">{r.title}</span>
                        <span className="shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] text-muted-foreground">
                          {r.categoryTitle}
                        </span>
                      </span>
                      <span className="line-clamp-1 text-xs text-muted-foreground">{r.description}</span>
                    </span>
                    <ChevronRight className="ml-auto mt-1 size-3.5 shrink-0 text-muted-foreground/50" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
