"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown, Sparkles, Send } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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

export function DiscussionDetail({ discussion: initial, userId }: { discussion: Discussion; userId?: string }) {
  const [discussion, setDiscussion] = useState(initial);
  const [reply, setReply] = useState("");
  const [posting, setPosting] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [userVote, setUserVote] = useState<1 | -1 | 0>(
    initial.upvotes.includes(userId ?? "") ? 1 : initial.downvotes.includes(userId ?? "") ? -1 : 0,
  );

  async function vote(v: 1 | -1) {
    const res = await fetch(`/api/discussions/${discussion._id}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vote: v }),
    });
    const data = await res.json();
    setDiscussion((d) => ({ ...d, upvotes: Array(data.upvotes).fill(""), downvotes: Array(data.downvotes).fill("") }));
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
      setDiscussion((d) => ({ ...d, replies: [...d.replies, data.reply] }));
      setReply("");
    } catch {
      toast.error("Failed to post reply");
    } finally {
      setPosting(false);
    }
  }

  async function getSummary() {
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

  const score = discussion.upvotes.length - discussion.downvotes.length;

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <div className="flex flex-col items-center gap-1 pt-1">
          <Button
            variant="ghost"
            size="icon"
            className={cn("size-8", userVote === 1 && "text-primary")}
            onClick={() => vote(1)}
          >
            <ChevronUp className="size-5" />
          </Button>
          <span className="text-sm font-bold">{score}</span>
          <Button
            variant="ghost"
            size="icon"
            className={cn("size-8", userVote === -1 && "text-destructive")}
            onClick={() => vote(-1)}
          >
            <ChevronDown className="size-5" />
          </Button>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="size-8">
              <AvatarImage src={discussion.author.image} />
              <AvatarFallback>{discussion.author.name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{discussion.author.name}</p>
              <p className="text-xs text-muted-foreground">
                @{discussion.author.username} · {new Date(discussion.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans">{discussion.content}</pre>
          </div>
          {discussion.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {discussion.tags.map((t) => (
                <span key={t} className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">{t}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {discussion.aiSummary ? (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="size-4 text-primary" />
              <span className="text-sm font-medium text-primary">AI Summary</span>
            </div>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{discussion.aiSummary}</p>
          </CardContent>
        </Card>
      ) : (
        <Button variant="outline" size="sm" onClick={getSummary} disabled={summarizing}>
          <Sparkles className="mr-1.5 size-3.5" />
          {summarizing ? "Generating summary..." : "Generate AI Summary"}
        </Button>
      )}

      <Separator />

      <div className="space-y-4">
        <h3 className="font-semibold">{discussion.replies.length} Replies</h3>

        {discussion.replies.map((r) => (
          <div key={r._id} className="flex gap-3">
            <Avatar className="size-7 shrink-0">
              <AvatarImage src={r.author.image} />
              <AvatarFallback className="text-xs">{r.author.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 rounded-xl bg-muted/50 px-4 py-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium">@{r.author.username}</span>
                <span className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="text-sm whitespace-pre-wrap">{r.content}</p>
            </div>
          </div>
        ))}

        {userId && (
          <div className="flex gap-3">
            <Textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Write a reply..."
              className="min-h-20 text-sm"
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
        )}
      </div>
    </div>
  );
}
