"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Pencil, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PromptEntry {
  key: string;
  name: string;
  description: string;
  template: string;
  temperature: number;
  maxTokens: number;
  overridden: boolean;
}

export function PromptsManager() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<PromptEntry | null>(null);

  const { data, isLoading } = useQuery<{ prompts: PromptEntry[] }>({
    queryKey: ["admin-prompts"],
    queryFn: async () => {
      const res = await fetch("/api/admin/prompts");
      if (!res.ok) throw new Error("Failed to load prompts");
      return res.json();
    },
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["admin-prompts"] });
  }

  const reset = useMutation({
    mutationFn: async (key: string) => {
      const res = await fetch(`/api/admin/prompts?key=${key}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Reset failed");
    },
    onSuccess: () => {
      toast.success("Prompt reset to default");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        These templates drive every AI feature. Placeholders like{" "}
        <code className="rounded bg-muted px-1 font-mono text-xs">
          {"{{context}}"}
        </code>{" "}
        are filled at runtime. Overrides are stored in the database; defaults
        live in code.
      </p>
      {(data?.prompts ?? []).map((prompt) => (
        <Card key={prompt.key} className="py-0">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">{prompt.name}</p>
                <Badge variant="outline" className="font-mono text-[10px]">
                  {prompt.key}
                </Badge>
                {prompt.overridden && (
                  <Badge variant="secondary" className="text-[10px]">
                    customized
                  </Badge>
                )}
              </div>
              <p className="truncate text-xs text-muted-foreground">
                {prompt.description} · temp {prompt.temperature} ·{" "}
                {prompt.maxTokens} tokens
              </p>
            </div>
            {prompt.overridden && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => reset.mutate(prompt.key)}
                aria-label="Reset to default"
              >
                <RotateCcw className="size-4" />
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditing(prompt)}
            >
              <Pencil className="size-3.5" /> Edit
            </Button>
          </CardContent>
        </Card>
      ))}

      {editing && (
        <EditPromptDialog
          prompt={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            invalidate();
          }}
        />
      )}
    </div>
  );
}

function EditPromptDialog({
  prompt,
  onClose,
  onSaved,
}: {
  prompt: PromptEntry;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [template, setTemplate] = useState(prompt.template);
  const [temperature, setTemperature] = useState(String(prompt.temperature));
  const [maxTokens, setMaxTokens] = useState(String(prompt.maxTokens));

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/prompts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: prompt.key,
          template,
          temperature: Number(temperature),
          maxTokens: Number(maxTokens),
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? "Save failed");
    },
    onSuccess: () => {
      toast.success("Prompt saved");
      onSaved();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85svh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{prompt.name}</DialogTitle>
          <DialogDescription>{prompt.description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Textarea
            value={template}
            onChange={(event) => setTemplate(event.target.value)}
            rows={14}
            className="font-mono text-xs"
          />
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Temperature (0–2)</Label>
              <Input
                type="number"
                step="0.1"
                min={0}
                max={2}
                value={temperature}
                onChange={(event) => setTemperature(event.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Max tokens</Label>
              <Input
                type="number"
                min={64}
                max={32768}
                value={maxTokens}
                onChange={(event) => setMaxTokens(event.target.value)}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
            Save override
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
