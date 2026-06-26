"use client";

import { useState } from "react";
import { InfoLayout } from "@/components/shared/info-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Loader2 } from "@/components/icons";

const TYPES = [
  { value: "feature", label: "Feature Request", color: "border-blue-500/50 bg-blue-500/10 text-blue-500" },
  { value: "bug", label: "Bug Report", color: "border-red-500/50 bg-red-500/10 text-red-500" },
  { value: "issue", label: "Issue / Other", color: "border-amber-500/50 bg-amber-500/10 text-amber-500" },
] as const;

type FeedbackType = (typeof TYPES)[number]["value"];

export default function FeedbackPage() {
  const [type, setType] = useState<FeedbackType>("feature");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (title.trim().length < 3) {
      setError("Title must be at least 3 characters.");
      return;
    }
    if (description.trim().length < 10) {
      setError("Description must be at least 10 characters.");
      return;
    }
    if (email.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      setError("Enter a valid email address or leave it blank.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, title: title.trim(), description: description.trim(), email: email.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null) as { error?: string } | null;
        setError(data?.error ?? "Something went wrong. Please try again.");
        return;
      }
      setDone(true);
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <InfoLayout>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-green-500/15 mb-6">
            <CheckCircle2 className="size-8 text-green-500" />
          </div>
          <h1 className="text-2xl font-black tracking-tight">Thank you!</h1>
          <p className="mt-3 max-w-sm text-sm text-muted-foreground">
            Your feedback has been received. We read every submission and will follow up if needed.
          </p>
          <button
            onClick={() => { setDone(false); setTitle(""); setDescription(""); setEmail(""); setType("feature"); }}
            className="mt-8 text-sm text-primary underline underline-offset-4 hover:text-primary/80 transition-colors"
          >
            Submit another
          </button>
        </div>
      </InfoLayout>
    );
  }

  return (
    <InfoLayout>
      <div className="max-w-xl">
        <h1 className="text-3xl font-black tracking-tight">Feedback</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Report a bug, request a feature, or share anything on your mind. We read every message.
        </p>

        <form onSubmit={handleSubmit} className="mt-10 space-y-6">
          {/* Type selector */}
          <div className="space-y-2">
            <Label>Type</Label>
            <div className="flex flex-wrap gap-2">
              {TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-all ${
                    type === t.value ? t.color : "border-border text-muted-foreground hover:border-foreground/30"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder={
                type === "bug" ? "e.g. Editor crashes on Safari" :
                type === "feature" ? "e.g. Add dark mode toggle to editor" :
                "Brief summary of your issue"
              }
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder={
                type === "bug"
                  ? "Steps to reproduce, expected vs actual behaviour, browser/OS..."
                  : type === "feature"
                  ? "What problem does this solve? How should it work?"
                  : "Describe your issue in as much detail as you can..."
              }
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              maxLength={4000}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span className={description.trim().length > 0 && description.trim().length < 10 ? "text-destructive" : ""}>
                Minimum 10 characters
              </span>
              <span>{description.length}/4000</span>
            </div>
          </div>

          {/* Email (optional) */}
          <div className="space-y-1.5">
            <Label htmlFor="email">
              Your email <span className="text-muted-foreground font-normal">(optional — for follow-up)</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
            {submitting && <Loader2 className="size-4 animate-spin" />}
            Send feedback
          </Button>
        </form>
      </div>
    </InfoLayout>
  );
}
