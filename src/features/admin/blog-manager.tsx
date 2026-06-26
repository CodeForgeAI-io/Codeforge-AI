"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Eye, ImageIcon, Loader2, Newspaper, Sparkles, Trash2, Upload } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

interface BlogListItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  tags: string[];
  status: "draft" | "published";
  views: number;
  createdAt: string;
}

const EMPTY = {
  title: "", description: "", tags: "", content: "",
  seoTitle: "", seoDescription: "", seoKeywords: "",
};

/** Downscale an uploaded image to keep the data URL small. */
function fileToDataUrl(file: File, maxW = 1280, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxW / img.width);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas unavailable"));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function BlogManager() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [cover, setCover] = useState<string | null>(null);
  const [hint, setHint] = useState("");
  const [form, setForm] = useState({ ...EMPTY });
  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const { data, isLoading } = useQuery({
    queryKey: ["admin-blog"],
    queryFn: async () => {
      const res = await fetch("/api/admin/blog");
      if (!res.ok) throw new Error("Failed to load posts");
      return (await res.json()) as { posts: BlogListItem[] };
    },
  });

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setCover(await fileToDataUrl(file));
    } catch {
      toast.error("Could not read that image");
    }
  }

  const generate = useMutation({
    mutationFn: async () => {
      if (!cover) throw new Error("Upload a screenshot first");
      const res = await fetch("/api/admin/blog/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: cover, hint }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Generation failed");
      return d.generated as {
        title: string; description: string; tags: string[]; content: string;
        seoTitle: string; seoDescription: string; seoKeywords: string;
      };
    },
    onSuccess: (g) => {
      setForm({
        title: g.title, description: g.description, tags: g.tags.join(", "),
        content: g.content, seoTitle: g.seoTitle, seoDescription: g.seoDescription,
        seoKeywords: g.seoKeywords,
      });
      toast.success("Draft generated from screenshot");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Generation failed"),
  });

  const save = useMutation({
    mutationFn: async (status: "draft" | "published") => {
      if (!cover) throw new Error("A cover screenshot is required");
      if (!form.title.trim()) throw new Error("Title is required");
      const res = await fetch("/api/admin/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
          coverImage: cover,
          status,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Save failed");
    },
    onSuccess: (_d, status) => {
      toast.success(status === "published" ? "Post published" : "Draft saved");
      setForm({ ...EMPTY }); setCover(null); setHint("");
      if (fileRef.current) fileRef.current.value = "";
      qc.invalidateQueries({ queryKey: ["admin-blog"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
  });

  const toggle = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "draft" | "published" }) => {
      const res = await fetch(`/api/admin/blog/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Update failed");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-blog"] }),
    onError: () => toast.error("Could not update post"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/blog/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: () => { toast.success("Post deleted"); qc.invalidateQueries({ queryKey: ["admin-blog"] }); },
    onError: () => toast.error("Could not delete post"),
  });

  const posts = data?.posts ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Blog</h1>
        <p className="text-sm text-muted-foreground">
          Upload a feature screenshot — AI writes the title, description, tags, SEO and body. The screenshot becomes the cover.
        </p>
      </div>

      {/* create */}
      <section className="grid gap-6 rounded-xl border bg-card p-5 lg:grid-cols-[300px_1fr]">
        {/* cover upload */}
        <div className="space-y-3">
          <Label className="text-xs">Feature screenshot (cover)</Label>
          <div
            onClick={() => fileRef.current?.click()}
            className="flex aspect-[16/9] cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed bg-muted/30 text-muted-foreground hover:border-primary/40"
          >
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cover} alt="cover preview" className="h-full w-full object-cover" />
            ) : (
              <span className="flex flex-col items-center gap-1 text-xs">
                <ImageIcon className="size-6" /> Click to upload
              </span>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="hidden" />
          <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => fileRef.current?.click()}>
            <Upload className="size-4" /> {cover ? "Change image" : "Choose image"}
          </Button>
          <Textarea
            value={hint}
            onChange={(e) => setHint(e.target.value)}
            placeholder="Optional hint for the AI (e.g. 'This is the AI Mentor panel')"
            rows={2}
          />
          <Button className="w-full gap-2" onClick={() => generate.mutate()} disabled={!cover || generate.isPending}>
            {generate.isPending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            Generate with AI
          </Button>
        </div>

        {/* fields */}
        <div className="space-y-3">
          <Field label="Title"><Input value={form.title} onChange={set("title")} placeholder="Post title" /></Field>
          <Field label="Description"><Textarea value={form.description} onChange={set("description")} rows={2} placeholder="Short summary for the listing" /></Field>
          <Field label="Tags (comma separated)"><Input value={form.tags} onChange={set("tags")} placeholder="ai, feature, productivity" /></Field>
          <Field label="Content (markdown)"><Textarea value={form.content} onChange={set("content")} rows={8} placeholder="Post body — generated from the screenshot, editable" /></Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="SEO title"><Input value={form.seoTitle} onChange={set("seoTitle")} /></Field>
            <Field label="SEO keywords"><Input value={form.seoKeywords} onChange={set("seoKeywords")} /></Field>
          </div>
          <Field label="SEO description"><Textarea value={form.seoDescription} onChange={set("seoDescription")} rows={2} /></Field>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => save.mutate("draft")} disabled={save.isPending}>Save draft</Button>
            <Button onClick={() => save.mutate("published")} disabled={save.isPending}>
              {save.isPending ? <Loader2 className="size-4 animate-spin" /> : null} Publish
            </Button>
          </div>
        </div>
      </section>

      {/* list */}
      <div className="overflow-x-auto rounded-xl border bg-card">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
            <Newspaper className="size-6" /><p className="text-sm">No posts yet</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Post</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Published</TableHead>
                <TableHead>Views</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <p className="text-sm font-medium">{p.title}</p>
                    <p className="text-xs text-muted-foreground">/{p.slug}</p>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{(p.tags ?? []).slice(0, 3).join(", ")}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch checked={p.status === "published"} onCheckedChange={(v) => toggle.mutate({ id: p.id, status: v ? "published" : "draft" })} />
                      <span className="text-xs text-muted-foreground">{p.status}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm tabular-nums">{p.views}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button asChild variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground">
                        <a href={`/blog/${p.slug}`} target="_blank" rel="noopener noreferrer"><Eye className="size-4" /></a>
                      </Button>
                      <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive" onClick={() => remove.mutate(p.id)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
