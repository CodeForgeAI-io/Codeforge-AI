"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MessageSquare, ChevronUp, ChevronDown, Eye, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface Discussion {
  _id: string;
  title: string;
  kind: string;
  author: { username: string; name: string; image?: string };
  upvotes: string[];
  downvotes: string[];
  replies: unknown[];
  views: number;
  createdAt: string;
  tags: string[];
}

const KIND_COLORS: Record<string, string> = {
  discussion: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  solution: "bg-primary/10 text-primary border-primary/20",
  question: "bg-purple-500/10 text-purple-500 border-purple-500/20",
};

export function DiscussionList({
  questionId,
  showNew = true,
}: {
  questionId?: string;
  showNew?: boolean;
}) {
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [kind, setKind] = useState("all");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (questionId) params.set("question", questionId);
    if (kind !== "all") params.set("kind", kind);

    fetch(`/api/discussions?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setDiscussions(d.discussions ?? []);
        setTotal(d.total ?? 0);
      })
      .finally(() => setLoading(false));
  }, [questionId, kind, page]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Tabs value={kind} onValueChange={(v) => { setKind(v); setPage(1); }}>
          <TabsList className="h-8">
            <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
            <TabsTrigger value="discussion" className="text-xs">Discussion</TabsTrigger>
            <TabsTrigger value="solution" className="text-xs">Solutions</TabsTrigger>
            <TabsTrigger value="question" className="text-xs">Questions</TabsTrigger>
          </TabsList>
        </Tabs>
        {showNew && (
          <Button asChild size="sm" className="h-8">
            <Link href={questionId ? `/discuss/new?q=${questionId}` : "/discuss/new"}>
              <Plus className="mr-1.5 size-3.5" /> New Post
            </Link>
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : discussions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <MessageSquare className="mb-3 size-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No discussions yet. Start one!</p>
        </div>
      ) : (
        <div className="divide-y rounded-xl border">
          {discussions.map((d) => (
            <Link
              key={d._id}
              href={`/discuss/${d._id}`}
              className="flex items-start gap-3 p-4 transition-colors hover:bg-muted/50"
            >
              <div className="flex flex-col items-center gap-1 text-center shrink-0">
                <ChevronUp className="size-4 text-muted-foreground" />
                <span className="text-xs font-medium">{d.upvotes.length - d.downvotes.length}</span>
                <ChevronDown className="size-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn("inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium", KIND_COLORS[d.kind])}>
                    {d.kind}
                  </span>
                  <p className="font-medium text-sm leading-tight">{d.title}</p>
                </div>
                <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Avatar className="size-4">
                      <AvatarImage src={d.author.image} />
                      <AvatarFallback className="text-[8px]">{d.author.name[0]}</AvatarFallback>
                    </Avatar>
                    {d.author.username}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="size-3" /> {d.replies?.length ?? 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="size-3" /> {d.views}
                  </span>
                  <span>{new Date(d.createdAt).toLocaleDateString()}</span>
                </div>
                {d.tags.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {d.tags.slice(0, 3).map((t) => (
                      <span key={t} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{t}</span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {total > 20 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <Button variant="outline" size="sm" disabled={discussions.length < 20} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
