"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  ChevronUp,
  Eye,
  MessageSquare,
  Search,
  Tag,
  TrendingUp,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface Discussion {
  _id: string;
  title: string;
  kind: string;
  author: { username: string; name: string; image?: string };
  upvotes: string[];
  downvotes: string[];
  views: number;
  createdAt: string;
  tags: string[];
  isPinned?: boolean;
}

const KIND_STYLES: Record<string, { label: string; cls: string }> = {
  discussion: { label: "Discussion", cls: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  solution: { label: "Solution", cls: "bg-primary/10 text-primary border-primary/20" },
  question: { label: "Question", cls: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
  editorial: { label: "Editorial", cls: "bg-green-500/10 text-green-600 border-green-500/20" },
};

const KINDS = ["All", "Discussion", "Solution", "Question"] as const;

export function ForumList({ signedIn }: { signedIn: boolean }) {
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [kind, setKind] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (kind !== "All") params.set("kind", kind.toLowerCase());
    if (search.trim()) params.set("q", search.trim());

    fetch(`/api/discussions?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setDiscussions(d.discussions ?? []);
        setTotal(d.total ?? 0);
      })
      .finally(() => setLoading(false));
  }, [kind, page, search]);

  const pages = Math.ceil(total / 20);

  return (
    <div className="space-y-4">
      {/* filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search threads..."
            className="h-9 pl-9"
          />
        </div>
        <div className="flex gap-1 rounded-lg border bg-muted/40 p-1">
          {KINDS.map((k) => (
            <button
              key={k}
              onClick={() => { setKind(k); setPage(1); }}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                kind === k ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {k}
            </button>
          ))}
        </div>
      </div>

      {/* count */}
      <p className="text-xs text-muted-foreground">{total.toLocaleString()} threads</p>

      {/* list */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : discussions.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center gap-3">
          <MessageSquare className="size-12 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No threads found.</p>
          {!signedIn && <p className="text-xs text-muted-foreground">Sign in to start the first discussion!</p>}
        </div>
      ) : (
        <div className="divide-y rounded-xl border overflow-hidden">
          {discussions.map((d) => {
            const kindStyle = KIND_STYLES[d.kind] ?? KIND_STYLES.discussion;
            const score = d.upvotes.length - d.downvotes.length;
            return (
              <Link
                key={d._id}
                href={`/forum/${d._id}`}
                className={cn(
                  "group flex items-start gap-4 p-4 transition-colors hover:bg-muted/40",
                  d.isPinned && "bg-primary/3",
                )}
              >
                {/* vote score */}
                <div className="flex shrink-0 flex-col items-center gap-0.5 pt-0.5 text-center w-9">
                  <ChevronUp className="size-4 text-muted-foreground/50" />
                  <span className={cn("text-sm font-bold", score > 0 ? "text-primary" : "text-muted-foreground")}>
                    {score}
                  </span>
                </div>

                {/* content */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    {d.isPinned && (
                      <span className="inline-flex items-center gap-1 rounded border border-primary/30 bg-primary/5 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                        📌 Pinned
                      </span>
                    )}
                    <span className={cn("inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium", kindStyle.cls)}>
                      {kindStyle.label}
                    </span>
                    <p className="text-sm font-semibold leading-snug group-hover:text-primary">
                      {d.title}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Avatar className="size-4">
                        <AvatarImage src={d.author.image} />
                        <AvatarFallback className="text-[8px]">{d.author.name[0]}</AvatarFallback>
                      </Avatar>
                      @{d.author.username}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="size-3" /> {d.views}
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="size-3" />
                      {formatDistanceToNow(new Date(d.createdAt), { addSuffix: true })}
                    </span>
                  </div>

                  {d.tags.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap items-center gap-1">
                      <Tag className="size-3 text-muted-foreground/50" />
                      {d.tags.slice(0, 4).map((t) => (
                        <span key={t} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg border px-3 py-1.5 text-xs font-medium disabled:opacity-40 hover:bg-muted/50"
          >
            ← Previous
          </button>
          <span className="text-xs text-muted-foreground">Page {page} of {pages}</span>
          <button
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page >= pages}
            className="rounded-lg border px-3 py-1.5 text-xs font-medium disabled:opacity-40 hover:bg-muted/50"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
