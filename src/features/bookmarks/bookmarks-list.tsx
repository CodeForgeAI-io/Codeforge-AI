"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Bookmark, Code2, Layout, Trash2, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface BookmarkItem {
  _id: string;
  kind: "question" | "challenge";
  list: string;
  createdAt: string;
  question?: { _id: string; slug: string; title: string; difficulty: string; category: string };
  challenge?: { _id: string; slug: string; title: string; difficulty: string; tech: string };
}

export function BookmarksList() {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");

  useEffect(() => {
    fetch("/api/bookmarks")
      .then((r) => r.json())
      .then((d) => setBookmarks(d.bookmarks ?? []))
      .finally(() => setLoading(false));
  }, []);

  async function removeBookmark(id: string, kind: string, refId: string) {
    await fetch("/api/bookmarks", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, id: refId }),
    });
    setBookmarks((prev) => prev.filter((b) => b._id !== id));
    toast.success("Removed from bookmarks");
  }

  const filtered = tab === "all" ? bookmarks : bookmarks.filter((b) => b.kind === tab);

  if (loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">All ({bookmarks.length})</TabsTrigger>
          <TabsTrigger value="question">
            <Code2 className="mr-1.5 size-3.5" />
            Problems ({bookmarks.filter((b) => b.kind === "question").length})
          </TabsTrigger>
          <TabsTrigger value="challenge">
            <Layout className="mr-1.5 size-3.5" />
            Challenges ({bookmarks.filter((b) => b.kind === "challenge").length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Bookmark className="mb-3 size-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No bookmarks yet</p>
          <Button asChild variant="outline" className="mt-4" size="sm">
            <Link href="/problems">Browse Problems</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((b) => {
            const item = b.question ?? b.challenge;
            const href = b.question
              ? `/problems/${b.question.slug}`
              : `/challenges/${b.challenge?.slug}`;
            const meta = b.question ? b.question.category : b.challenge?.tech;
            const refId = (b.question?._id ?? b.challenge?._id) as string;

            return (
              <Card key={b._id} className="group relative hover:border-primary/40 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <Link href={href} className="flex-1 min-w-0">
                      <p className="font-medium text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                        {item?.title}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <DifficultyBadge difficulty={item?.difficulty ?? ""} />
                        {meta && (
                          <span className="text-xs text-muted-foreground truncate">{meta}</span>
                        )}
                      </div>
                    </Link>
                    <div className="flex gap-1 shrink-0">
                      <Button asChild variant="ghost" size="icon" className="size-7">
                        <Link href={href}>
                          <ExternalLink className="size-3.5" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-muted-foreground hover:text-destructive"
                        onClick={() => removeBookmark(b._id, b.kind, refId)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                  <p className="mt-2 text-[10px] text-muted-foreground">
                    {new Date(b.createdAt).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
