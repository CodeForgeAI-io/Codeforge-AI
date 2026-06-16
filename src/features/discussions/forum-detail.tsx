"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  ChevronUp,
  ChevronDown,
  CornerDownRight,
  LogIn,
  MessageSquare,
  Send,
  Share2,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ReplyAuthor {
  _id: string;
  username: string;
  name: string;
  image?: string;
}

interface Reply {
  _id: string;
  author: ReplyAuthor;
  content: string;
  upvotes: string[];
  parentReply?: string | null;
  createdAt: string;
}

interface Discussion {
  _id: string;
  title: string;
  content: string;
  kind: string;
  language?: string;
  author: ReplyAuthor;
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

function shareThread(title: string) {
  const url = window.location.href;
  if (navigator.share) {
    navigator.share({ title, url }).catch(() => {});
  } else {
    navigator.clipboard.writeText(url)
      .then(() => toast.success("Link copied to clipboard"))
      .catch(() => toast.error("Failed to copy link"));
  }
}

export function ForumDetail({
  discussion: initial,
  userId,
  userRole,
  signedIn,
}: {
  discussion: Discussion;
  userId?: string;
  userRole?: string;
  signedIn: boolean;
}) {
  const router = useRouter();
  const [discussion, setDiscussion] = useState(initial);
  const [topReply, setTopReply] = useState("");
  const [posting, setPosting] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [deletingReply, setDeletingReply] = useState<string | null>(null);
  const [userVote, setUserVote] = useState<1 | -1 | 0>(
    initial.upvotes.includes(userId ?? "") ? 1
      : initial.downvotes.includes(userId ?? "") ? -1 : 0,
  );

  const score = discussion.upvotes.length - discussion.downvotes.length;
  const kindStyle = KIND_STYLES[discussion.kind] ?? KIND_STYLES.discussion;
  const isAuthor = !!userId && discussion.author._id === userId;
  const isAdmin = userRole === "admin";

  // Build threaded reply tree
  const topReplies = discussion.replies.filter((r) => !r.parentReply);
  const subReplyMap = new Map<string, Reply[]>();
  for (const r of discussion.replies) {
    if (r.parentReply) {
      const list = subReplyMap.get(r.parentReply) ?? [];
      list.push(r);
      subReplyMap.set(r.parentReply, list);
    }
  }

  async function vote(v: 1 | -1) {
    if (!signedIn) {
      toast.error("Sign in to vote", {
        action: {
          label: "Sign in",
          onClick: () => { window.location.href = `/login?callbackUrl=/forum/${discussion._id}`; },
        },
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

  async function postTopReply() {
    if (!topReply.trim()) return;
    setPosting(true);
    try {
      const res = await fetch(`/api/discussions/${discussion._id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: topReply.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDiscussion((d) => ({ ...d, replies: [...d.replies, data.reply] }));
      setTopReply("");
      toast.success("Reply posted");
    } catch {
      toast.error("Failed to post reply");
    } finally {
      setPosting(false);
    }
  }

  async function postSubReply(parentReplyId: string) {
    if (!replyContent.trim()) return;
    setPosting(true);
    try {
      const res = await fetch(`/api/discussions/${discussion._id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyContent.trim(), parentReplyId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDiscussion((d) => ({ ...d, replies: [...d.replies, data.reply] }));
      setReplyContent("");
      setReplyingTo(null);
      toast.success("Reply posted");
    } catch {
      toast.error("Failed to post reply");
    } finally {
      setPosting(false);
    }
  }

  async function deleteDiscussion() {
    if (!confirm("Delete this thread? This cannot be undone.")) return;
    const res = await fetch(`/api/discussions/${discussion._id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Thread deleted");
      router.push("/forum");
    } else {
      toast.error("Failed to delete");
    }
  }

  async function deleteReply(replyId: string) {
    if (!confirm("Delete this reply?")) return;
    setDeletingReply(replyId);
    try {
      const res = await fetch(`/api/discussions/${discussion._id}/reply/${replyId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      setDiscussion((d) => ({
        ...d,
        replies: d.replies.filter(
          (r) => r._id !== replyId && r.parentReply !== replyId,
        ),
      }));
      toast.success("Reply deleted");
    } catch {
      toast.error("Failed to delete reply");
    } finally {
      setDeletingReply(null);
    }
  }

  async function getSummary() {
    if (!signedIn) {
      toast.error("Sign in to use AI features", {
        action: {
          label: "Sign in",
          onClick: () => { window.location.href = `/login?callbackUrl=/forum/${discussion._id}`; },
        },
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
      {/* ── main post ────────────────────────────────────────────── */}
      <div className="flex gap-4">
        {/* vote column */}
        <div className="flex shrink-0 flex-col items-center gap-0.5 pt-1">
          <Button
            variant="ghost" size="icon"
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
            variant="ghost" size="icon"
            className={cn("size-8", userVote === -1 && "text-destructive")}
            onClick={() => vote(-1)}
            title={signedIn ? "Downvote" : "Sign in to vote"}
          >
            <ChevronDown className="size-5" />
          </Button>
        </div>

        {/* post body */}
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

          <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
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
                  @{discussion.author.username} · {formatDistanceToNow(new Date(discussion.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>

            {/* actions */}
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={() => shareThread(discussion.title)}>
                <Share2 className="size-3.5" /> Share
              </Button>
              {(isAuthor || isAdmin) && (
                <Button
                  variant="ghost" size="sm"
                  className="gap-1.5 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={deleteDiscussion}
                >
                  <Trash2 className="size-3.5" /> Delete
                </Button>
              )}
            </div>
          </div>

          <div className="rounded-xl border bg-card p-4">
            <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans">{discussion.content}</pre>
          </div>

          {discussion.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {discussion.tags.map((t) => (
                <span key={t} className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">{t}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── AI summary ─────────────────────────────────────────── */}
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

      {/* ── replies ───────────────────────────────────────────── */}
      <div className="space-y-1">
        <h3 className="mb-4 flex items-center gap-2 font-semibold">
          <MessageSquare className="size-4 text-muted-foreground" />
          {discussion.replies.length}{" "}
          {discussion.replies.length === 1 ? "Reply" : "Replies"}
        </h3>

        {topReplies.length === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No replies yet.{signedIn ? " Be the first to reply!" : " Sign in to reply."}
          </p>
        )}

        {topReplies.map((r) => {
          const subs = subReplyMap.get(r._id) ?? [];
          const canDelete = !!userId && (r.author._id === userId || isAdmin);
          return (
            <div key={r._id} className="space-y-2">
              {/* top-level reply */}
              <ReplyCard
                reply={r}
                canDelete={canDelete}
                isDeleting={deletingReply === r._id}
                onDelete={() => deleteReply(r._id)}
                onReply={signedIn ? () => setReplyingTo(replyingTo === r._id ? null : r._id) : undefined}
                replyingActive={replyingTo === r._id}
              />

              {/* sub-replies */}
              {subs.length > 0 && (
                <div className="ml-8 space-y-2 border-l-2 border-border pl-4">
                  {subs.map((sr) => {
                    const canDeleteSub = !!userId && (sr.author._id === userId || isAdmin);
                    return (
                      <ReplyCard
                        key={sr._id}
                        reply={sr}
                        canDelete={canDeleteSub}
                        isDeleting={deletingReply === sr._id}
                        onDelete={() => deleteReply(sr._id)}
                        isNested
                      />
                    );
                  })}
                </div>
              )}

              {/* inline reply box */}
              {replyingTo === r._id && (
                <div className="ml-8 flex gap-2 border-l-2 border-primary/40 pl-4">
                  <CornerDownRight className="mt-2.5 size-4 shrink-0 text-primary/60" />
                  <div className="flex flex-1 gap-2">
                    <Textarea
                      autoFocus
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder={`Reply to @${r.author.username}…`}
                      className="min-h-17.5 text-sm"
                    />
                    <div className="flex flex-col gap-1 self-end">
                      <Button
                        size="icon" className="size-8"
                        disabled={posting || !replyContent.trim()}
                        onClick={() => postSubReply(r._id)}
                      >
                        <Send className="size-3.5" />
                      </Button>
                      <Button
                        size="icon" variant="ghost" className="size-8 text-muted-foreground"
                        onClick={() => { setReplyingTo(null); setReplyContent(""); }}
                      >
                        ✕
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* new top-level reply or sign-in wall */}
        {signedIn ? (
          <div className="flex gap-3 pt-4">
            <Textarea
              value={topReply}
              onChange={(e) => setTopReply(e.target.value)}
              placeholder="Write a thoughtful reply…"
              className="min-h-[90px] text-sm"
            />
            <Button
              size="icon" className="shrink-0 self-end"
              disabled={posting || !topReply.trim()}
              onClick={postTopReply}
            >
              <Send className="size-4" />
            </Button>
          </div>
        ) : (
          <div className="mt-4 flex flex-col items-center gap-3 rounded-xl border-2 border-dashed py-8 text-center">
            <div className="flex size-11 items-center justify-center rounded-full bg-primary/10">
              <LogIn className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">Sign in to reply</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Join the community to share your thoughts</p>
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

/* ── shared reply card ───────────────────────────────────────────── */

function ReplyCard({
  reply,
  canDelete,
  isDeleting,
  onDelete,
  onReply,
  replyingActive,
  isNested = false,
}: {
  reply: Reply;
  canDelete: boolean;
  isDeleting: boolean;
  onDelete: () => void;
  onReply?: () => void;
  replyingActive?: boolean;
  isNested?: boolean;
}) {
  return (
    <div className={cn("flex gap-3", isNested && "")}>
      <Link href={`/profile/${reply.author.username}`} className="shrink-0">
        <Avatar className={cn("hover:ring-2 hover:ring-primary transition-all", isNested ? "size-6" : "size-7")}>
          <AvatarImage src={reply.author.image} />
          <AvatarFallback className="text-[10px]">{reply.author.name[0]}</AvatarFallback>
        </Avatar>
      </Link>
      <div className="flex-1 rounded-xl border bg-muted/30 px-4 py-3">
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Link href={`/profile/${reply.author.username}`} className="text-xs font-semibold hover:text-primary">
              @{reply.author.username}
            </Link>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
            </span>
          </div>
          <div className="flex items-center gap-0.5">
            {onReply && !isNested && (
              <button
                onClick={onReply}
                className={cn(
                  "flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium transition-colors",
                  replyingActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <CornerDownRight className="size-3" /> Reply
              </button>
            )}
            {canDelete && (
              <button
                onClick={onDelete}
                disabled={isDeleting}
                className="flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
              >
                <Trash2 className="size-3" /> {isDeleting ? "…" : "Delete"}
              </button>
            )}
          </div>
        </div>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{reply.content}</p>
      </div>
    </div>
  );
}
