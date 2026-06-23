"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useInfiniteQuery } from "@tanstack/react-query";
import {
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  Circle,
  CircleDot,
  Loader2,
} from "@/components/icons";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { QuestionListItem, QuestionListResult } from "@/services/questions";

const STATUS_ICONS = {
  solved: <CheckCircle2 className="size-4 shrink-0 text-easy" />,
  attempted: <CircleDot className="size-4 shrink-0 text-medium" />,
  todo: <Circle className="size-4 shrink-0 text-muted-foreground/30" />,
} as const;

interface Props {
  signedIn?: boolean;
}

export function ProblemsList({ signedIn }: Props) {
  const searchParams = useSearchParams();
  const filterKey = searchParams.toString();
  const sentinelRef = useRef<HTMLDivElement>(null);

  // bookmarked question ids
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    if (!signedIn) return;
    fetch("/api/bookmarks?kind=question")
      .then((r) => r.json())
      .then((data) => {
        const ids = new Set<string>(
          (data.bookmarks ?? []).map((b: { question?: { _id: string } }) => b.question?._id).filter(Boolean)
        );
        setBookmarked(ids);
      })
      .catch(() => {});
  }, [signedIn]);

  const toggleBookmark = useCallback(
    async (e: React.MouseEvent, item: QuestionListItem) => {
      e.preventDefault();
      e.stopPropagation();
      if (!signedIn) {
        toast.info("Sign in to bookmark problems");
        return;
      }
      const alreadySaved = bookmarked.has(item.id);
      setTogglingId(item.id);
      // optimistic
      setBookmarked((prev) => {
        const next = new Set(prev);
        if (alreadySaved) next.delete(item.id);
        else next.add(item.id);
        return next;
      });
      try {
        if (alreadySaved) {
          await fetch("/api/bookmarks", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ kind: "question", id: item.id }),
          });
          toast.success("Bookmark removed");
        } else {
          await fetch("/api/bookmarks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ kind: "question", id: item.id }),
          });
          toast.success("Bookmarked!");
        }
      } catch {
        // rollback
        setBookmarked((prev) => {
          const next = new Set(prev);
          if (alreadySaved) next.add(item.id);
          else next.delete(item.id);
          return next;
        });
        toast.error("Failed to update bookmark");
      } finally {
        setTogglingId(null);
      }
    },
    [signedIn, bookmarked],
  );

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
      <div className="space-y-1.5">
        {Array.from({ length: 10 }).map((_, i) => (
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

  const items: QuestionListItem[] = data?.pages.flatMap((p) => p.items) ?? [];
  const total = data?.pages[0]?.total ?? 0;

  if (items.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-muted-foreground">No problems match these filters.</p>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-2 text-xs text-muted-foreground">{total} problems</p>

      {/* table header */}
      <div className="mb-1 grid grid-cols-[28px_1fr_auto_auto_auto] items-center gap-3 px-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground sm:grid-cols-[28px_1fr_120px_80px_80px_36px]">
        <span />
        <span>Title</span>
        <span className="hidden sm:block">Category</span>
        <span className="hidden text-right sm:block">Acceptance</span>
        <span>Difficulty</span>
        {signedIn && <span />}
      </div>

      <div className="overflow-hidden rounded-xl border">
        {items.map((item, index) => {
          const isSaved = bookmarked.has(item.id);
          const isToggling = togglingId === item.id;
          return (
            <div
              key={item.id}
              className={cn(
                "group grid grid-cols-[28px_1fr_auto_auto_auto] items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/40 sm:grid-cols-[28px_1fr_120px_80px_80px_36px]",
                index % 2 === 1 && "bg-muted/20",
              )}
            >
              {/* status */}
              <span className="flex justify-center">{STATUS_ICONS[item.status]}</span>

              {/* title + companies */}
              <Link href={`/problems/${item.slug}`} className="min-w-0">
                <p className="truncate text-sm font-medium hover:text-primary">
                  {item.title}
                </p>
                <div className="mt-0.5 flex flex-wrap items-center gap-1">
                  <span className="text-[11px] text-muted-foreground sm:hidden">
                    {item.category}
                  </span>
                  {item.companies.slice(0, 2).map((company) => (
                    <Badge
                      key={company}
                      variant="secondary"
                      className="px-1.5 py-0 text-[10px]"
                    >
                      {company}
                    </Badge>
                  ))}
                </div>
              </Link>

              {/* category (desktop) */}
              <span className="hidden truncate text-xs text-muted-foreground sm:block">
                {item.category}
              </span>

              {/* acceptance (desktop) */}
              <span className="hidden text-right text-xs text-muted-foreground sm:block">
                {item.acceptanceRate !== null ? `${item.acceptanceRate}%` : "—"}
              </span>

              {/* difficulty */}
              <DifficultyBadge difficulty={item.difficulty} />

              {/* bookmark */}
              {signedIn && (
                <button
                  onClick={(e) => toggleBookmark(e, item)}
                  disabled={isToggling}
                  aria-label={isSaved ? "Remove bookmark" : "Bookmark problem"}
                  className={cn(
                    "flex size-7 items-center justify-center rounded-md transition-colors",
                    isSaved
                      ? "text-primary hover:text-primary/70"
                      : "text-muted-foreground/30 opacity-0 group-hover:opacity-100 hover:text-primary",
                  )}
                >
                  {isToggling ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : isSaved ? (
                    <BookmarkCheck className="size-4" />
                  ) : (
                    <Bookmark className="size-4" />
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div ref={sentinelRef} className="flex justify-center py-4">
        {isFetchingNextPage && (
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        )}
      </div>
    </div>
  );
}
