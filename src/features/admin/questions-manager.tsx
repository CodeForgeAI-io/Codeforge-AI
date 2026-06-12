"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  FileUp,
  Loader2,
  Pencil,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";

interface AdminQuestion {
  id: string;
  slug: string;
  title: string;
  difficulty: string;
  category: string;
  isPublished: boolean;
  source: string;
  submissions: number;
}

const JSON_TEMPLATE = `{
  "title": "Two Sum",
  "difficulty": "Easy",
  "category": "Arrays",
  "tags": ["Array", "HashMap"],
  "companies": ["Google"],
  "description": "Given an array of integers and a target...\\n\\nInput format: first line is the array as JSON, second line is the target.\\nOutput: indices as a JSON array.",
  "examples": [{ "input": "[2,7,11,15]\\n9", "output": "[0,1]" }],
  "constraints": ["2 <= nums.length <= 10000"],
  "starterCode": {
    "javascript": "const input = require('fs').readFileSync(0,'utf8').trim().split('\\\\n');\\n// your code, print result with console.log",
    "python": "import sys\\ndata = sys.stdin.read().strip().split('\\\\n')\\n# your code, print the result"
  },
  "testCases": [
    { "input": "[2,7,11,15]\\n9", "expected": "[0,1]", "hidden": false },
    { "input": "[3,2,4]\\n6", "expected": "[1,2]", "hidden": true }
  ],
  "solution": "...",
  "editorial": "...",
  "hints": ["Think about lookups", "Use a hash map", "One pass is enough"],
  "isPublished": false
}`;

export function QuestionsManager() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery<{ questions: AdminQuestion[] }>({
    queryKey: ["admin-questions", search],
    queryFn: async () => {
      const res = await fetch(
        `/api/admin/questions?q=${encodeURIComponent(search)}`,
      );
      if (!res.ok) throw new Error("Failed to load questions");
      return res.json();
    },
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["admin-questions"] });
  }

  async function uploadJson(file: File) {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const res = await fetch("/api/admin/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? "Upload failed");
      toast.success(
        `Imported ${result.created.length} question(s)` +
          (result.failed.length ? `, ${result.failed.length} failed` : ""),
      );
      for (const failure of result.failed ?? []) {
        toast.error(`${failure.title}: ${failure.reason}`);
      }
      invalidate();
    } catch (uploadError) {
      toast.error(
        uploadError instanceof Error
          ? uploadError.message
          : "Invalid JSON file",
      );
    }
  }

  const togglePublish = useMutation({
    mutationFn: async ({ id, isPublished }: { id: string; isPublished: boolean }) => {
      const res = await fetch(`/api/admin/questions/${id}`, {
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
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search questions..."
            className="h-9 pl-8"
          />
        </div>
        <div className="ml-auto flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) uploadJson(file);
              event.target.value = "";
            }}
          />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <FileUp className="size-4" /> Upload JSON
          </Button>
          <GenerateDialog onDone={invalidate} />
          <CreateEditDialog onDone={invalidate} />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : !data?.questions.length ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          No questions yet. Upload a JSON file or generate some with AI.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Subs</TableHead>
                <TableHead>Published</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.questions.map((question) => (
                <TableRow key={question.id}>
                  <TableCell className="max-w-64 truncate font-medium">
                    {question.title}
                  </TableCell>
                  <TableCell>
                    <DifficultyBadge difficulty={question.difficulty} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {question.category}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">
                      {question.source}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {question.submissions}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={question.isPublished}
                      onCheckedChange={(checked) =>
                        togglePublish.mutate({
                          id: question.id,
                          isPublished: checked,
                        })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <CreateEditDialog questionId={question.id} onDone={invalidate} />
                      <DeleteButton
                        id={question.id}
                        title={question.title}
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

function GenerateDialog({ onDone }: { onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [count, setCount] = useState("5");

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/questions/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, count: Number(count) }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? "Generation failed");
      return result as {
        created: { title: string }[];
        rejected: { title: string; reason: string }[];
      };
    },
    onSuccess: (result) => {
      toast.success(
        `Generated ${result.created.length} draft question(s). Review and publish them.`,
      );
      for (const rejection of result.rejected) {
        toast.warning(`Skipped "${rejection.title}": ${rejection.reason}`);
      }
      setOpen(false);
      setPrompt("");
      onDone();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Sparkles className="size-4 text-primary" /> Generate with AI
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate questions with AI</DialogTitle>
            <DialogDescription>
              Describe what you want — e.g. “Create 10 DSA Medium Array
              Questions”. Generated questions are saved as drafts for review.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Create 5 Medium difficulty questions about sliding window..."
              rows={3}
            />
            <div className="flex items-center gap-2">
              <Label className="text-sm">How many:</Label>
              <Select value={count} onValueChange={setCount}>
                <SelectTrigger className="w-24" size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 5, 8, 10].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending || prompt.trim().length < 10}
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Generating...
                </>
              ) : (
                "Generate"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function CreateEditDialog({
  questionId,
  onDone,
}: {
  questionId?: string;
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [json, setJson] = useState(JSON_TEMPLATE);
  const [loading, setLoading] = useState(false);
  const isEdit = !!questionId;

  async function openDialog() {
    setOpen(true);
    if (isEdit) {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/questions/${questionId}`);
        const result = await res.json();
        if (!res.ok) throw new Error(result.error ?? "Failed to load");
        const editable = { ...result.question };
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
        isEdit ? `/api/admin/questions/${questionId}` : "/api/admin/questions",
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
      toast.success(isEdit ? "Question updated" : "Question created");
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
        <Button onClick={openDialog}>New question</Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85svh] sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {isEdit ? "Edit question" : "Create question"}
            </DialogTitle>
            <DialogDescription>
              Questions are authored as JSON. Programs read input from stdin
              and print the answer to stdout.
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

export function DeleteButton({
  id,
  title,
  onDone,
  endpoint = "/api/admin/questions",
}: {
  id: string;
  title: string;
  onDone: () => void;
  endpoint?: string;
}) {
  const [open, setOpen] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${endpoint}/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error ?? "Delete failed");
      }
    },
    onSuccess: () => {
      toast.success("Deleted");
      setOpen(false);
      onDone();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        aria-label="Delete"
      >
        <Trash2 className="size-4 text-destructive" />
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{title}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes it along with its submissions. This
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                mutation.mutate();
              }}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {mutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
