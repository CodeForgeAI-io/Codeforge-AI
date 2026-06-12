"use client";

import { useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackPreview,
  SandpackConsole,
  useSandpack,
} from "@codesandbox/sandpack-react";
import { CheckSquare, Loader2, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Markdown } from "@/components/shared/markdown";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { FRONTEND_TECH_LABELS, type FrontendTech } from "@/lib/constants";
import type { ChallengeDetail } from "@/services/challenges";
import { MentorPanel } from "@/features/ai-mentor/mentor-panel";

const TEMPLATES: Record<FrontendTech, "static" | "vanilla" | "react"> = {
  "html-css": "static",
  javascript: "vanilla",
  react: "react",
  "react-tailwind": "react",
};

interface ReviewResult {
  score: number;
  verdict: "pass" | "fail";
  feedback: string;
  rewards: {
    xpEarned: number;
    newLevel: number | null;
    newBadges: { name: string; description: string }[];
  } | null;
}

export function SandboxWorkspace({ challenge }: { challenge: ChallengeDetail }) {
  const { resolvedTheme } = useTheme();
  const tech = challenge.tech as FrontendTech;

  const files = useMemo(() => {
    const starters = Object.entries(challenge.starterFiles);
    if (starters.length === 0) return undefined;
    return Object.fromEntries(
      starters.map(([path, code]) => [
        path.startsWith("/") ? path : `/${path}`,
        { code },
      ]),
    );
  }, [challenge.starterFiles]);

  return (
    <SandpackProvider
      template={TEMPLATES[tech] ?? "static"}
      files={files}
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      options={{
        externalResources:
          tech === "react-tailwind" ? ["https://cdn.tailwindcss.com"] : [],
        autorun: true,
        recompileMode: "delayed",
        recompileDelay: 500,
      }}
    >
      <div className="grid h-[calc(100svh-3.5rem)] grid-rows-[auto_1fr] lg:grid-cols-[340px_1fr] lg:grid-rows-1">
        <BriefPanel challenge={challenge} />
        <div className="min-h-0 min-w-0 border-l">
          <SandpackLayout style={{ height: "100%", borderRadius: 0, border: 0 }}>
            <SandpackCodeEditor
              showTabs
              showLineNumbers
              showInlineErrors
              wrapContent
              style={{ height: "100%", minWidth: "40%" }}
            />
            <div
              style={{ height: "100%", minWidth: "35%" }}
              className="flex flex-col"
            >
              <SandpackPreview style={{ flex: 7 }} showOpenInCodeSandbox={false} />
              <SandpackConsole style={{ flex: 3 }} resetOnPreviewRestart />
            </div>
          </SandpackLayout>
        </div>
      </div>
    </SandpackProvider>
  );
}

function BriefPanel({ challenge }: { challenge: ChallengeDetail }) {
  const [aiOpen, setAiOpen] = useState(false);

  return (
    <div className="flex min-h-0 flex-col">
      <Tabs
        value={aiOpen ? "ai" : "brief"}
        onValueChange={(value) => setAiOpen(value === "ai")}
        className="flex h-full min-h-0 flex-col gap-0"
      >
        <div className="flex items-center justify-between border-b px-2 py-1.5">
          <TabsList>
            <TabsTrigger value="brief">Brief</TabsTrigger>
            <TabsTrigger value="ai">
              <Sparkles className="size-3.5" /> AI Help
            </TabsTrigger>
          </TabsList>
          <SubmitFlow challenge={challenge} />
        </div>

        <TabsContent value="brief" className="min-h-0 flex-1">
          <ScrollArea className="h-full">
            <div className="space-y-4 p-4">
              <div>
                <h1 className="text-lg font-semibold">{challenge.title}</h1>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <DifficultyBadge difficulty={challenge.difficulty} />
                  <Badge variant="secondary">
                    {FRONTEND_TECH_LABELS[tech(challenge)]}
                  </Badge>
                  {challenge.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-[10px]">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
              <Markdown>{challenge.description}</Markdown>
              {challenge.checklist.length > 0 && (
                <div>
                  <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
                    <CheckSquare className="size-4" /> Requirements
                  </p>
                  <ul className="space-y-1.5 text-sm text-muted-foreground">
                    {challenge.checklist.map((item, index) => (
                      <li key={index} className="flex gap-2">
                        <span className="text-primary">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="ai" className="min-h-0 flex-1">
          <MentorPanel context="challenge" challengeId={challenge.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function tech(challenge: ChallengeDetail): FrontendTech {
  return challenge.tech as FrontendTech;
}

function SubmitFlow({ challenge }: { challenge: ChallengeDetail }) {
  const { sandpack } = useSandpack();
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState<number[]>([]);
  const [result, setResult] = useState<ReviewResult | null>(null);

  const mutation = useMutation({
    mutationFn: async (): Promise<ReviewResult> => {
      const files = Object.fromEntries(
        Object.entries(sandpack.files)
          .filter(([path]) => !path.startsWith("/node_modules"))
          .map(([path, file]) => [path, file.code]),
      );
      const res = await fetch("/api/challenges/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId: challenge.id,
          files,
          checkedItems: checked,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Submission failed");
      return data;
    },
    onSuccess: (data) => {
      setResult(data);
      if (data.verdict === "pass") {
        toast.success(
          data.rewards && data.rewards.xpEarned > 0
            ? `Challenge passed! +${data.rewards.xpEarned} XP`
            : "Challenge passed!",
        );
        for (const badge of data.rewards?.newBadges ?? []) {
          toast.success(`Badge earned: ${badge.name}`);
        }
      } else {
        toast.error("Not quite there yet — check the feedback.");
      }
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Send className="size-3.5" /> Submit
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85svh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Submit “{challenge.title}”</DialogTitle>
            <DialogDescription>
              Check off the requirements you completed, then submit for AI
              review.
            </DialogDescription>
          </DialogHeader>

          {result ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span
                  className={`text-3xl font-bold ${
                    result.verdict === "pass" ? "text-success" : "text-destructive"
                  }`}
                >
                  {result.score}
                </span>
                <Badge
                  variant={result.verdict === "pass" ? "default" : "destructive"}
                >
                  {result.verdict === "pass" ? "Passed" : "Needs work"}
                </Badge>
              </div>
              <div className="rounded-lg border bg-muted/30 p-3">
                <Markdown>{result.feedback}</Markdown>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setResult(null)}>
                  Revise & resubmit
                </Button>
                <Button onClick={() => setOpen(false)}>Done</Button>
              </DialogFooter>
            </div>
          ) : (
            <>
              <div className="space-y-2.5">
                {challenge.checklist.map((item, index) => (
                  <label
                    key={index}
                    className="flex cursor-pointer items-start gap-2.5 text-sm"
                  >
                    <Checkbox
                      checked={checked.includes(index)}
                      onCheckedChange={(value) =>
                        setChecked((prev) =>
                          value
                            ? [...prev, index]
                            : prev.filter((i) => i !== index),
                        )
                      }
                      className="mt-0.5"
                    />
                    {item}
                  </label>
                ))}
              </div>
              <DialogFooter>
                <Button
                  disabled={mutation.isPending}
                  onClick={() => mutation.mutate()}
                >
                  {mutation.isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Reviewing...
                    </>
                  ) : (
                    "Submit for review"
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
