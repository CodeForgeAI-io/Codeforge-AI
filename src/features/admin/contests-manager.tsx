"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import { Loader2 } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeleteButton } from "./questions-manager";

interface AdminContest {
  id: string;
  slug: string;
  title: string;
  type: string;
  startsAt: string;
  durationMinutes: number;
  isPublished: boolean;
  participantCount: number;
  questionCount: number;
}

interface AdminQuestionOption {
  id: string;
  title: string;
  difficulty: string;
  isPublished: boolean;
}

export function ContestsManager() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{ contests: AdminContest[] }>({
    queryKey: ["admin-contests"],
    queryFn: async () => {
      const res = await fetch("/api/admin/contests");
      if (!res.ok) throw new Error("Failed to load contests");
      return res.json();
    },
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["admin-contests"] });
  }

  const togglePublish = useMutation({
    mutationFn: async ({ id, isPublished }: { id: string; isPublished: boolean }) => {
      const res = await fetch(`/api/admin/contests/${id}`, {
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
        <CreateContestDialog onDone={invalidate} />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : !data?.contests.length ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          No contests yet. Schedule your first weekly contest!
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Starts</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Problems</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Published</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.contests.map((contest) => (
                <TableRow key={contest.id}>
                  <TableCell className="max-w-56 truncate font-medium">
                    {contest.title}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {contest.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(contest.startsAt), "MMM d, HH:mm")}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {contest.durationMinutes}m
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {contest.questionCount}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {contest.participantCount}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={contest.isPublished}
                      onCheckedChange={(checked) =>
                        togglePublish.mutate({
                          id: contest.id,
                          isPublished: checked,
                        })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <DeleteButton
                      id={contest.id}
                      title={contest.title}
                      endpoint="/api/admin/contests"
                      onDone={invalidate}
                    />
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

function CreateContestDialog({ onDone }: { onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("weekly");
  const [startsAt, setStartsAt] = useState("");
  const [duration, setDuration] = useState("90");
  const [publish, setPublish] = useState(true);
  const [selected, setSelected] = useState<Record<string, number>>({});

  const { data: questionsData } = useQuery<{ questions: AdminQuestionOption[] }>({
    queryKey: ["admin-questions", ""],
    queryFn: async () => {
      const res = await fetch("/api/admin/questions");
      if (!res.ok) throw new Error("Failed to load questions");
      return res.json();
    },
    enabled: open,
  });

  const published = (questionsData?.questions ?? []).filter(
    (question) => question.isPublished,
  );

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/contests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          type,
          startsAt: new Date(startsAt).toISOString(),
          durationMinutes: Number(duration),
          questions: Object.entries(selected).map(([questionId, points]) => ({
            questionId,
            points,
          })),
          isPublished: publish,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? "Create failed");
    },
    onSuccess: () => {
      toast.success("Contest created");
      setOpen(false);
      setTitle("");
      setSelected({});
      onDone();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const valid =
    title.trim().length >= 3 && startsAt && Object.keys(selected).length > 0;

  return (
    <>
      <Button onClick={() => setOpen(true)}>New contest</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85svh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Schedule a contest</DialogTitle>
            <DialogDescription>
              Pick published questions and assign points to each.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid gap-1.5">
              <Label>Title</Label>
              <Input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Weekly Contest #1"
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Description (markdown, optional)</Label>
              <Textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="grid gap-1.5">
                <Label>Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger size="sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Starts at</Label>
                <Input
                  type="datetime-local"
                  value={startsAt}
                  onChange={(event) => setStartsAt(event.target.value)}
                  className="h-8"
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Duration (min)</Label>
                <Input
                  type="number"
                  min={5}
                  max={600}
                  value={duration}
                  onChange={(event) => setDuration(event.target.value)}
                  className="h-8"
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>Problems ({Object.keys(selected).length} selected)</Label>
              {published.length === 0 ? (
                <p className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
                  No published questions available. Publish questions first.
                </p>
              ) : (
                <ScrollArea className="h-44 rounded-md border">
                  <div className="space-y-1 p-2">
                    {published.map((question) => {
                      const checked = question.id in selected;
                      return (
                        <div
                          key={question.id}
                          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent/40"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(value) =>
                              setSelected((prev) => {
                                const next = { ...prev };
                                if (value) next[question.id] = 100;
                                else delete next[question.id];
                                return next;
                              })
                            }
                          />
                          <span className="min-w-0 flex-1 truncate">
                            {question.title}
                          </span>
                          <Badge variant="outline" className="text-[10px]">
                            {question.difficulty}
                          </Badge>
                          {checked && (
                            <Input
                              type="number"
                              min={10}
                              max={1000}
                              value={selected[question.id]}
                              onChange={(event) =>
                                setSelected((prev) => ({
                                  ...prev,
                                  [question.id]: Number(event.target.value),
                                }))
                              }
                              className="h-7 w-20 text-xs"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={publish} onCheckedChange={setPublish} />
              Publish immediately
            </label>
          </div>
          <DialogFooter>
            <Button
              onClick={() => mutation.mutate()}
              disabled={!valid || mutation.isPending}
            >
              {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
              Create contest
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
