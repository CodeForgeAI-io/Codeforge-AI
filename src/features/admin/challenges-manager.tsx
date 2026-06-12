"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { FRONTEND_TECH_LABELS, type FrontendTech } from "@/lib/constants";
import { DeleteButton } from "./questions-manager";

interface AdminChallenge {
  id: string;
  slug: string;
  title: string;
  difficulty: string;
  tech: string;
  isPublished: boolean;
  attempts: number;
}

const CHALLENGE_TEMPLATE = `{
  "title": "Responsive Pricing Card",
  "difficulty": "Easy",
  "tech": "html-css",
  "tags": ["CSS", "Flexbox"],
  "brief": "Build a responsive pricing card with a hover state.",
  "description": "## Build a pricing card\\n\\nCreate a centered pricing card with a title, price, feature list and a call-to-action button.\\n\\n- Mobile-first, must look good from 320px up\\n- Button needs hover and focus states",
  "designSpec": "A centered card (max-width 360px) on a soft background. Card: white surface, 16px radius, subtle shadow, 24px padding. Title 20px semibold, price 36px bold with /month suffix muted, 4 feature rows with check icons, full-width primary button. On screens >= 768px the card sits centered vertically.",
  "starterFiles": {
    "/index.html": "<!DOCTYPE html>\\n<html>\\n<head>\\n  <link rel=\\"stylesheet\\" href=\\"styles.css\\">\\n</head>\\n<body>\\n  <!-- build here -->\\n</body>\\n</html>",
    "/styles.css": "/* your styles */"
  },
  "checklist": [
    "Card is centered and responsive from 320px",
    "Semantic HTML with proper heading structure",
    "Button has visible hover and focus states",
    "Feature list uses a real list element"
  ],
  "isPublished": false
}`;

export function ChallengesManager() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{ challenges: AdminChallenge[] }>({
    queryKey: ["admin-challenges"],
    queryFn: async () => {
      const res = await fetch("/api/admin/challenges");
      if (!res.ok) throw new Error("Failed to load challenges");
      return res.json();
    },
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["admin-challenges"] });
  }

  const togglePublish = useMutation({
    mutationFn: async ({ id, isPublished }: { id: string; isPublished: boolean }) => {
      const res = await fetch(`/api/admin/challenges/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished }),
      });
      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error ?? "Update failed");
      }
    },
    onSuccess: () => invalidate(),
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ChallengeDialog onDone={invalidate} />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : !data?.challenges.length ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          No frontend challenges yet. Create your first one!
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead>Tech</TableHead>
                <TableHead>Attempts</TableHead>
                <TableHead>Published</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.challenges.map((challenge) => (
                <TableRow key={challenge.id}>
                  <TableCell className="max-w-64 truncate font-medium">
                    {challenge.title}
                  </TableCell>
                  <TableCell>
                    <DifficultyBadge difficulty={challenge.difficulty} />
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-[10px]">
                      {FRONTEND_TECH_LABELS[challenge.tech as FrontendTech] ??
                        challenge.tech}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {challenge.attempts}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={challenge.isPublished}
                      onCheckedChange={(checked) =>
                        togglePublish.mutate({
                          id: challenge.id,
                          isPublished: checked,
                        })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <ChallengeDialog
                        challengeId={challenge.id}
                        onDone={invalidate}
                      />
                      <DeleteButton
                        id={challenge.id}
                        title={challenge.title}
                        endpoint="/api/admin/challenges"
                        onDone={invalidate}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function ChallengeDialog({
  challengeId,
  onDone,
}: {
  challengeId?: string;
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [json, setJson] = useState(CHALLENGE_TEMPLATE);
  const [loading, setLoading] = useState(false);
  const isEdit = !!challengeId;

  async function openDialog() {
    setOpen(true);
    if (isEdit) {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/challenges/${challengeId}`);
        const result = await res.json();
        if (!res.ok) throw new Error(result.error ?? "Failed to load");
        const editable = { ...result.challenge };
        delete editable.id;
        setJson(JSON.stringify(editable, null, 2));
      } catch (loadError) {
        toast.error(
          loadError instanceof Error ? loadError.message : "Failed to load",
        );
        setOpen(false);
      } finally {
        setLoading(false);
      }
    }
  }

  const mutation = useMutation({
    mutationFn: async () => {
      const parsed = JSON.parse(json);
      const res = await fetch(
        isEdit
          ? `/api/admin/challenges/${challengeId}`
          : "/api/admin/challenges",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed),
        },
      );
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? "Save failed");
    },
    onSuccess: () => {
      toast.success(isEdit ? "Challenge updated" : "Challenge created");
      setOpen(false);
      onDone();
    },
    onError: (error: Error) =>
      toast.error(
        error.message.startsWith("Unexpected")
          ? `Invalid JSON: ${error.message}`
          : error.message,
      ),
  });

  return (
    <>
      {isEdit ? (
        <Button variant="ghost" size="icon" onClick={openDialog} aria-label="Edit">
          <Pencil className="size-4" />
        </Button>
      ) : (
        <Button onClick={openDialog}>New challenge</Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85svh] sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {isEdit ? "Edit challenge" : "Create challenge"}
            </DialogTitle>
            <DialogDescription>
              Challenges are authored as JSON. `designSpec` is what the AI
              reviewer grades against; `starterFiles` seed the sandbox.
            </DialogDescription>
          </DialogHeader>
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="size-5 animate-spin" />
            </div>
          ) : (
            <Textarea
              value={json}
              onChange={(event) => setJson(event.target.value)}
              rows={18}
              className="font-mono text-xs"
            />
          )}
          <DialogFooter>
            <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
              {isEdit ? "Save changes" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
