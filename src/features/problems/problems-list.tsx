"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useInfiniteQuery } from "@tanstack/react-query";
import { CheckCircle2, Circle, CircleDot, Loader2 } from "lucide-react";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { QuestionListItem, QuestionListResult } from "@/services/questions";

const STATUS_ICONS = {
  solved: <CheckCircle2 className="size-4 text-success" />,
  attempted: <CircleDot className="size-4 text-warning" />,
  todo: <Circle className="size-4 text-muted-foreground/40" />,
} as const;

export function ProblemsList() {
  const searchParams = useSearchParams();
  const filterKey = searchParams.toString();
  const sentinelRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ["problems", filterKey],
      queryFn: async ({ pageParam }): Promise<QuestionListResult> => {
        const params = new URLSearchParams(filterKey);
        params.set("page", String(pageParam));
        const res = await fetch(`/api/questions?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to load problems");
        return res.json();
      },
      initialPageParam: 1,
      getNextPageParam: (lastPage) =>
        lastPage.hasMore ? lastPage.page + 1 : undefined,
    });

  // Infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "300px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Failed to load problems. Please try again.
      </p>
    );
  }

  const items: QuestionListItem[] =
    data?.pages.flatMap((page) => page.items) ?? [];
  const total = data?.pages[0]?.total ?? 0;

  if (items.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-muted-foreground">
          No problems match these filters yet.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-3 text-xs text-muted-foreground">{total} problems</p>
      <div className="overflow-hidden rounded-xl border">
        {items.map((item, index) => (
          <Link
            key={item.id}
            href={`/problems/${item.slug}`}
            className={`flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/50 ${
              index % 2 === 1 ? "bg-muted/30" : ""
            }`}
          >
            {STATUS_ICONS[item.status]}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{item.title}</p>
              <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-muted-foreground">
                  {item.category}
                </span>
                {item.companies.slice(0, 3).map((company) => (
                  <Badge
                    key={company}
                    variant="secondary"
                    className="px-1.5 py-0 text-[10px]"
                  >
                    {company}
                  </Badge>
                ))}
              </div>
            </div>
            <span className="hidden w-16 text-right text-xs text-muted-foreground sm:block">
              {item.acceptanceRate !== null ? `${item.acceptanceRate}%` : "—"}
            </span>
            <DifficultyBadge difficulty={item.difficulty} />
          </Link>
        ))}
      </div>
      <div ref={sentinelRef} className="flex justify-center py-4">
        {isFetchingNextPage && (
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        )}
      </div>
    </div>
  );
}
