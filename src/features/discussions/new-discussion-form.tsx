"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export function NewDiscussionForm({ questionId, redirectTo }: { questionId?: string; redirectTo?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    content: "",
    kind: "discussion",
    tags: "",
    language: "",
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      toast.error("Title and content are required");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/discussions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId,
          title: form.title.trim(),
          content: form.content.trim(),
          kind: form.kind,
          tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
          language: form.language || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Discussion created!");
      router.push(`${redirectTo ?? "/discuss"}/${data.discussion._id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create discussion");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-2">
        <Label>Type</Label>
        <Select value={form.kind} onValueChange={(v) => setForm((f) => ({ ...f, kind: v }))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="discussion">Discussion</SelectItem>
            <SelectItem value="solution">Community Solution</SelectItem>
            <SelectItem value="question">Question</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Title</Label>
        <Input
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="Enter a descriptive title..."
          maxLength={200}
        />
      </div>

      {form.kind === "solution" && (
        <div className="space-y-2">
          <Label>Language</Label>
          <Input
            value={form.language}
            onChange={(e) => setForm((f) => ({ ...f, language: e.target.value }))}
            placeholder="e.g. Python, JavaScript, Java"
          />
        </div>
      )}

      <div className="space-y-2">
        <Label>Content (Markdown supported)</Label>
        <Textarea
          value={form.content}
          onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
          placeholder="Share your thoughts, approach, or solution..."
          className="min-h-50 font-mono text-sm"
          maxLength={10000}
        />
      </div>

      <div className="space-y-2">
        <Label>Tags (comma separated)</Label>
        <Input
          value={form.tags}
          onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
          placeholder="e.g. dynamic-programming, optimization"
        />
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? "Posting..." : "Post Discussion"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
