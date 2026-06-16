"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  ChevronUp,
  ChevronDown,
  LogIn,
  MessageSquare,
  Send,
  Sparkles,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Reply {
  _id: string;
  author: { username: string; name: string; image?: string };
  content: string;
  upvotes: string[];
  createdAt: string;
}

interface Discussion {
  _id: string;
  title: string;
  content: string;
  kind: string;
  language?: string;
  author: { username: string; name: string; image?: string };
  upvotes: string[];
  downvotes: string[];
  replies: Reply[];
  views: number;
  createdAt: string;
  tags: string[];
  aiSummary?: string;
}

const KIND_STYLES: Record<string, { label: string; cls: string }> = {
  discussion: { label: "Discussion", cls: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  solution: { label: "Solution", cls: "bg-primary/10 text-primary border-primary/20" },
  question: { label: "Question", cls: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
  editorial: { label: "Editorial", cls: "bg-green-500/10 text-green-600 border-green-500/20" },
};

export function ForumDetail({
  discussion: initial,
  userId,
  signedIn,
}: {
  discussion: Discussion;
  userId?: string;
  signedIn: boolean;
}) {
  const [discussion, setDiscussion] = useState(initial);
  const [reply, setReply] = useState("");
  const [posting, setPosting] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [userVote, setUserVote] = useState<1 | -1 | 0>(
    initial.upvotes.includes(userId ?? "") ? 1
      : initial.downvotes.includes(userId ?? "") ? -1 : 0,
  );

  const score = discussion.upvotes.length - discussion.downvotes.length;
  const kindStyle = KIND_STYLES[discussion.kind] ?? KIND_STYLES.discussion;

  async function vote(v: 1 | -1) {
    if (!signedIn) {
      toast.error("Sign in to vote", {
        action: { label: "Sign in", onClick: () => { window.location.href = `/login?callbackUrl=/forum/${discussion._id}`; } },
      });
      return;
    }
    const res = await fetch(`/api/discussions/${discussion._id}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vote: v }),
    });
    const data = await res.json();
    setDiscussion((d) => ({
      ...d,
      upvotes: Array(data.upvotes).fill(""),
      downvotes: Array(data.downvotes).fill(""),
    }));
    setUserVote(data.userVote);
  }

  async function postReply() {
    if (!reply.trim()) return;
    setPosting(true);
    try {
      const res = await fetch(`/api/discussions/${discussion._id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: reply.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDiscussion((d) => ({ ...d, replies: [...d.replies, data.reply] }));
      setReply("");
      toast.success("Reply posted");
    } catch {
      toast.error("Failed to post reply");
    } finally {
      setPosting(false);
    }
  }

  async function getSummary() {
    if (!signedIn) {
      toast.error("Sign in to use AI features", {
        action: { label: "Sign in", onClick: () => { window.location.href = `/login?callbackUrl=/forum/${discussion._id}`; } },
      });
      return;
    }
    setSummarizing(true);
    try {
      const res = await fetch(`/api/discussions/${discussion._id}/ai-summary`, { method: "POST" });
      const data = await res.json();
      setDiscussion((d) => ({ ...d, aiSummary: data.summary }));
      toast.success("AI summary generated");
    } catch {
      toast.error("Failed to generate summary");
    } finally {
      setSummarizing(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* main post */}
      <div className="flex gap-4">
        {/* vote column */}
        <div className="flex flex-col items-center gap-0.5 pt-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className={cn("size-8", userVote === 1 && "text-primary")}
            onClick={() => vote(1)}
            title={signedIn ? "Upvote" : "Sign in to vote"}
          >
            <ChevronUp className="size-5" />
          </Button>
          <span className={cn("text-sm font-bold", score > 0 ? "text-primary" : score < 0 ? "text-destructive" : "text-muted-foreground")}>
            {score}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className={cn("size-8", userVote === -1 && "text-destructive")}
            onClick={() => vote(-1)}
            title={signedIn ? "Downvote" : "Sign in to vote"}
          >
            <ChevronDown className="size-5" />
          </Button>
        </div>

        {/* post content */}
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className={cn("inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium", kindStyle.cls)}>
              {kindStyle.label}
            </span>
            {discussion.language && (
              <span className="rounded border bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground">
                {discussion.language}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 mb-4">
            <Link href={`/profile/${discussion.author.username}`}>
              <Avatar className="size-8 ring-2 ring-border hover:ring-primary transition-all">
                <AvatarImage src={discussion.author.image} />
                <AvatarFallback>{discussion.author.name[0]}</AvatarFallback>
              </Avatar>
            </Link>
            <div>
              <Link href={`/profile/${discussion.author.username}`} className="text-sm font-semibold hover:text-primary">
                {discussion.author.name}
              </Link>
              <p className="text-xs text-muted-foreground">
                @{discussion.author.username} ·{" "}
                {formatDistanceToNow(new Date(discussion.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-4">
            <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans">{discussion.content}</pre>
          </div>

          {discussion.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {discussion.tags.map((t) => (
                <span key={t} className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* AI summary */}
      {discussion.aiSummary ? (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="size-4 text-primary" />
              <span className="text-sm font-semibold text-primary">AI Summary</span>
            </div>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{discussion.aiSummary}</p>
          </CardContent>
        </Card>
      ) : (
        <Button variant="outline" size="sm" onClick={getSummary} disabled={summarizing}>
          <Sparkles className="mr-1.5 size-3.5" />
          {summarizing ? "Generating..." : "Generate AI Summary"}
        </Button>
      )}

      <Separator />

      {/* replies */}
      <div className="space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <MessageSquare className="size-4 text-muted-foreground" />
          {discussion.replies.length} {discussion.replies.length === 1 ? "Reply" : "Replies"}
        </h3>

        {discussion.replies.length === 0 && (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No replies yet. {signedIn ? "Be the first to reply!" : "Sign in to reply."}
          </p>
        )}

        {discussion.replies.map((r) => (
          <div key={r._id} className="flex gap-3">
            <Link href={`/profile/${r.author.username}`} className="shrink-0">
              <Avatar className="size-7 hover:ring-2 hover:ring-primary transition-all">
                <AvatarImage src={r.author.image} />
                <AvatarFallback className="text-xs">{r.author.name[0]}</AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex-1 rounded-xl border bg-muted/30 px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <Link href={`/profile/${r.author.username}`} className="text-xs font-semibold hover:text-primary">
                  @{r.author.username}
                </Link>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}
                </span>
              </div>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{r.content}</p>
            </div>
          </div>
        ))}

        {/* reply box OR login wall */}
        {signedIn ? (
          <div className="flex gap-3 pt-2">
            <Textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Write a thoughtful reply..."
              className="min-h-[90px] text-sm"
            />
            <Button
              size="icon"
              className="shrink-0 self-end"
              disabled={posting || !reply.trim()}
              onClick={postReply}
            >
              <Send className="size-4" />
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center rounded-xl border-2 border-dashed border-border py-8 text-center gap-3 mt-4">
            <div className="flex size-11 items-center justify-center rounded-full bg-primary/10">
              <LogIn className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">Sign in to reply</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Join the community to share your thoughts
              </p>
            </div>
            <div className="flex gap-2">
              <Button asChild size="sm">
                <Link href={`/login?callbackUrl=/forum/${discussion._id}`}>Sign in</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/register">Create account</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
