"use client";

import { useState, useEffect, useCallback } from "react";
import { StickyNote, Plus, Trash2, Save, Lock, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Note {
  _id: string;
  title: string;
  content: string;
  isPrivate: boolean;
  updatedAt: string;
}

export function NotesPanel({ questionId }: { questionId?: string }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [active, setActive] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    const url = questionId ? `/api/notes?question=${questionId}` : "/api/notes";
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        setNotes(d.notes ?? []);
        if (d.notes?.length > 0) setActive(d.notes[0]);
      })
      .finally(() => setLoading(false));
  }, [questionId]);

  async function createNote() {
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId, title: "New Note", content: "" }),
    });
    const { note } = await res.json();
    setNotes((prev) => [note, ...prev]);
    setActive(note);
    setDirty(false);
  }

  async function saveNote() {
    if (!active) return;
    setSaving(true);
    try {
      await fetch(`/api/notes/${active._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: active.title, content: active.content, isPrivate: active.isPrivate }),
      });
      setNotes((prev) => prev.map((n) => (n._id === active._id ? { ...active } : n)));
      setDirty(false);
      toast.success("Note saved");
    } finally {
      setSaving(false);
    }
  }

  async function deleteNote(id: string) {
    await fetch(`/api/notes/${id}`, { method: "DELETE" });
    const next = notes.filter((n) => n._id !== id);
    setNotes(next);
    setActive(next[0] ?? null);
    toast.success("Note deleted");
  }

  function update(field: keyof Note, value: string | boolean) {
    if (!active) return;
    setActive((prev) => prev ? { ...prev, [field]: value } : null);
    setDirty(true);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <StickyNote className="size-4 text-primary" />
          Notes
        </div>
        <Button size="icon" variant="ghost" className="size-7" onClick={createNote}>
          <Plus className="size-4" />
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-36 shrink-0 border-r">
          <ScrollArea className="h-full">
            {loading ? (
              <div className="space-y-1 p-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-10 rounded bg-muted animate-pulse" />
                ))}
              </div>
            ) : notes.length === 0 ? (
              <div className="p-3 text-center text-xs text-muted-foreground">
                No notes yet.
                <Button variant="link" size="sm" className="block mx-auto" onClick={createNote}>
                  Create one
                </Button>
              </div>
            ) : (
              <div className="space-y-0.5 p-1.5">
                {notes.map((n) => (
                  <button
                    key={n._id}
                    onClick={() => { setActive(n); setDirty(false); }}
                    className={cn(
                      "w-full rounded-md px-2 py-1.5 text-left text-xs transition-colors",
                      active?._id === n._id
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted",
                    )}
                  >
                    <p className="truncate font-medium">{n.title}</p>
                    <p className={cn("truncate text-[10px]", active?._id === n._id ? "text-primary-foreground/70" : "text-muted-foreground")}>
                      {new Date(n.updatedAt).toLocaleDateString()}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {active ? (
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex items-center gap-2 border-b px-3 py-2">
              <Input
                value={active.title}
                onChange={(e) => update("title", e.target.value)}
                className="h-7 border-0 bg-transparent p-0 text-sm font-medium shadow-none focus-visible:ring-0"
                placeholder="Note title..."
              />
              <Button
                size="icon"
                variant="ghost"
                className="size-7 shrink-0"
                title={active.isPrivate ? "Private" : "Public"}
                onClick={() => update("isPrivate", !active.isPrivate)}
              >
                {active.isPrivate ? <Lock className="size-3.5" /> : <Globe className="size-3.5 text-primary" />}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="size-7 shrink-0 text-destructive"
                onClick={() => deleteNote(active._id)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
            <Textarea
              value={active.content}
              onChange={(e) => update("content", e.target.value)}
              className="flex-1 resize-none rounded-none border-0 font-mono text-xs shadow-none focus-visible:ring-0"
              placeholder="Write your notes here... Markdown supported"
            />
            {dirty && (
              <div className="flex items-center justify-end border-t px-3 py-2">
                <Button size="sm" className="h-7 text-xs" onClick={saveNote} disabled={saving}>
                  <Save className="mr-1.5 size-3.5" />
                  {saving ? "Saving..." : "Save"}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center text-xs text-muted-foreground">
            Select or create a note
          </div>
        )}
      </div>
    </div>
  );
}
