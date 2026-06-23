"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlarmClock,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  MonitorPlay,
  Play,
  Square,
  Video,
} from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Markdown } from "@/components/shared/markdown";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { CodeEditor } from "@/features/workspace/code-editor";
import { Countdown } from "@/features/contests/contest-card";
import {
  LANGUAGES,
  QUESTION_CATEGORIES,
  getLanguage,
  type LanguageId,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

interface InterviewQuestion {
  id: string;
  slug: string;
  title: string;
  difficulty: string;
  category: string;
  description: string;
  examples: { input: string; output: string; explanation?: string }[];
  constraints: string[];
  starterCode: Record<string, string>;
  sampleTests: { input: string; expected: string }[];
}

interface QuestionProgress {
  solved: boolean;
  timeSpentSeconds: number;
  code: string;
  language: LanguageId;
}

type Phase = "setup" | "running" | "report";

export function InterviewMode() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [settings, setSettings] = useState({
    category: "any",
    difficulty: "Medium",
    count: 2,
    durationMinutes: 45,
  });
  const [endsAt, setEndsAt] = useState<string>("");
  const [progressMap, setProgressMap] = useState<Record<string, QuestionProgress>>({});
  const [report, setReport] = useState<string>("");

  const startMutation = useMutation({
    mutationFn: async (): Promise<InterviewQuestion[]> => {
      const params = new URLSearchParams({
        category: settings.category,
        difficulty: settings.difficulty,
        count: String(settings.count),
      });
      const res = await fetch(`/api/interview/questions?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not start interview");
      return data.questions;
    },
    onSuccess: (loaded) => {
      setQuestions(loaded);
      setProgressMap(
        Object.fromEntries(
          loaded.map((question) => [
            question.id,
            {
              solved: false,
              timeSpentSeconds: 0,
              code: "",
              language: "javascript" as LanguageId,
            },
          ]),
        ),
      );
      setEndsAt(
        new Date(Date.now() + settings.durationMinutes * 60_000).toISOString(),
      );
      setPhase("running");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const feedbackMutation = useMutation({
    mutationFn: async (): Promise<string> => {
      const res = await fetch("/api/ai/interview-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic:
            settings.category === "any" ? "Mixed topics" : settings.category,
          durationMinutes: settings.durationMinutes,
          questions: questions.map((question) => {
            const progress = progressMap[question.id];
            return {
              title: question.title,
              difficulty: question.difficulty,
              solved: progress?.solved ?? false,
              timeSpentSeconds: progress?.timeSpentSeconds ?? 0,
              code: progress?.code || undefined,
              language: progress?.language,
            };
          }),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Feedback failed");
      return data.report;
    },
    onSuccess: (text) => setReport(text),
    onError: (error: Error) => {
      toast.error(error.message);
      setReport(
        "## Session complete\n\nAI feedback was unavailable. Review your solutions in the Submissions tab of each problem.",
      );
    },
  });

  function finishSession() {
    setPhase("report");
    feedbackMutation.mutate();
  }

  if (phase === "setup") {
    return (
      <SetupScreen
        settings={settings}
        setSettings={setSettings}
        starting={startMutation.isPending}
        onStart={() => startMutation.mutate()}
      />
    );
  }

  if (phase === "running") {
    return (
      <SessionScreen
        questions={questions}
        endsAt={endsAt}
        progressMap={progressMap}
        setProgressMap={setProgressMap}
        onFinish={finishSession}
      />
    );
  }

  return (
    <ReportScreen
      report={report}
      loading={feedbackMutation.isPending}
      questions={questions}
      progressMap={progressMap}
      onRestart={() => {
        setPhase("setup");
        setReport("");
      }}
    />
  );
}

function SetupScreen({
  settings,
  setSettings,
  starting,
  onStart,
}: {
  settings: { category: string; difficulty: string; count: number; durationMinutes: number };
  setSettings: React.Dispatch<React.SetStateAction<{ category: string; difficulty: string; count: number; durationMinutes: number }>>;
  starting: boolean;
  onStart: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <Card className="glass">
        <CardHeader>
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10">
            <MonitorPlay className="size-5 text-primary" />
          </div>
          <CardTitle className="text-xl">Mock Interview</CardTitle>
          <CardDescription>
            A timed, realistic interview session with an AI performance report
            at the end. Optional screen recording stays on your device.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SettingRow label="Topic">
            <Select
              value={settings.category}
              onValueChange={(value) =>
                setSettings((prev) => ({ ...prev, category: value }))
              }
            >
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any topic</SelectItem>
                {QUESTION_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingRow>
          <SettingRow label="Difficulty">
            <Select
              value={settings.difficulty}
              onValueChange={(value) =>
                setSettings((prev) => ({ ...prev, difficulty: value }))
              }
            >
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["Easy", "Medium", "Hard"].map((difficulty) => (
                  <SelectItem key={difficulty} value={difficulty}>
                    {difficulty}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingRow>
          <SettingRow label="Questions">
            <Select
              value={String(settings.count)}
              onValueChange={(value) =>
                setSettings((prev) => ({ ...prev, count: Number(value) }))
              }
            >
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4].map((count) => (
                  <SelectItem key={count} value={String(count)}>
                    {count} question{count > 1 ? "s" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingRow>
          <SettingRow label="Duration">
            <Select
              value={String(settings.durationMinutes)}
              onValueChange={(value) =>
                setSettings((prev) => ({
                  ...prev,
                  durationMinutes: Number(value),
                }))
              }
            >
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[20, 30, 45, 60, 90].map((minutes) => (
                  <SelectItem key={minutes} value={String(minutes)}>
                    {minutes} minutes
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingRow>
          <Button className="w-full" onClick={onStart} disabled={starting}>
            {starting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Play className="size-4" />
            )}
            Start interview
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function SettingRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </div>
  );
}

function SessionScreen({
  questions,
  endsAt,
  progressMap,
  setProgressMap,
  onFinish,
}: {
  questions: InterviewQuestion[];
  endsAt: string;
  progressMap: Record<string, QuestionProgress>;
  setProgressMap: React.Dispatch<
    React.SetStateAction<Record<string, QuestionProgress>>
  >;
  onFinish: () => void;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = questions[activeIndex];
  const progress = progressMap[active.id];
  const [running, setRunning] = useState(false);
  const [runOutput, setRunOutput] = useState("");

  // Track time spent on the active question
  useEffect(() => {
    const interval = setInterval(() => {
      setProgressMap((prev) => ({
        ...prev,
        [active.id]: {
          ...prev[active.id],
          timeSpentSeconds: (prev[active.id]?.timeSpentSeconds ?? 0) + 1,
        },
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, [active.id, setProgressMap]);

  function updateProgress(patch: Partial<QuestionProgress>) {
    setProgressMap((prev) => ({
      ...prev,
      [active.id]: { ...prev[active.id], ...patch },
    }));
  }

  const code =
    progress.code ||
    active.starterCode[progress.language] ||
    getLanguage(progress.language)?.defaultSnippet ||
    "";

  async function runCode() {
    setRunning(true);
    setRunOutput("");
    try {
      const res = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: active.id,
          language: progress.language,
          code,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Run failed");
      const lines = (
        data.results as {
          passed: boolean | null;
          actual: string;
          stderr: string;
        }[]
      ).map(
        (result, index) =>
          `Test ${index + 1}: ${result.passed ? "PASS" : "FAIL"}${
            result.stderr ? `\n  stderr: ${result.stderr}` : ""
          }${!result.passed ? `\n  output: ${result.actual}` : ""}`,
      );
      setRunOutput(
        `${data.passedCount}/${data.totalCount} sample tests passed\n\n${lines.join("\n")}`,
      );
    } catch (runError) {
      setRunOutput(
        runError instanceof Error ? runError.message : "Run failed",
      );
    } finally {
      setRunning(false);
    }
  }

  async function submitCode() {
    setRunning(true);
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: active.id,
          language: progress.language,
          code,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Submit failed");
      if (data.status === "Accepted") {
        toast.success("Accepted!");
        updateProgress({ solved: true });
      } else {
        toast.error(`${data.status} (${data.passedCount}/${data.totalCount})`);
      }
      setRunOutput(
        `Verdict: ${data.status} — ${data.passedCount}/${data.totalCount} tests passed`,
      );
    } catch (submitError) {
      toast.error(
        submitError instanceof Error ? submitError.message : "Submit failed",
      );
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="flex h-[calc(100svh-3.5rem)] flex-col">
      {/* Session toolbar */}
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b px-3 py-2">
        <AlarmClock className="size-4 text-warning" />
        <span className="text-sm font-semibold">
          <Countdown target={endsAt} onComplete={onFinish} />
        </span>
        <div className="mx-2 flex gap-1">
          {questions.map((question, index) => (
            <button
              key={question.id}
              onClick={() => setActiveIndex(index)}
              className={cn(
                "flex size-7 items-center justify-center rounded-md border text-xs font-medium transition-colors",
                index === activeIndex && "border-primary bg-primary/10 text-primary",
                progressMap[question.id]?.solved &&
                  "border-success bg-success/10 text-success",
              )}
            >
              {progressMap[question.id]?.solved ? (
                <CheckCircle2 className="size-3.5" />
              ) : (
                index + 1
              )}
            </button>
          ))}
        </div>
        <ScreenRecorder />
        <Button
          variant="destructive"
          size="sm"
          className="ml-auto"
          onClick={onFinish}
        >
          <Square className="size-3.5" /> End interview
        </Button>
      </div>

      {/* Question + editor */}
      <div className="min-h-0 flex-1">
        <ResizablePanelGroup orientation="horizontal">
          <ResizablePanel defaultSize="38%" minSize="24%">
            <ScrollArea className="h-full">
              <div className="space-y-4 p-4">
                <div>
                  <h2 className="text-lg font-semibold">{active.title}</h2>
                  <div className="mt-1.5 flex gap-1.5">
                    <DifficultyBadge difficulty={active.difficulty} />
                    <Badge variant="secondary">{active.category}</Badge>
                  </div>
                </div>
                <Markdown>{active.description}</Markdown>
                {active.examples.map((example, index) => (
                  <div key={index} className="rounded-lg border bg-muted/30 p-3 font-mono text-xs">
                    <p>Input: {example.input}</p>
                    <p>Output: {example.output}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize="62%" minSize="35%">
            <div className="flex h-full flex-col">
              <div className="flex items-center gap-1.5 border-b px-2 py-1.5">
                <Select
                  value={progress.language}
                  onValueChange={(value) =>
                    updateProgress({ language: value as LanguageId, code: "" })
                  }
                >
                  <SelectTrigger size="sm" className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((lang) => (
                      <SelectItem key={lang.id} value={lang.id}>
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="ml-auto flex gap-1.5">
                  <Button variant="secondary" size="sm" disabled={running} onClick={runCode}>
                    <Play className="size-3.5" /> Run
                  </Button>
                  <Button size="sm" disabled={running} onClick={submitCode}>
                    Submit
                  </Button>
                </div>
              </div>
              <div className="min-h-0 flex-1">
                <CodeEditor
                  language={getLanguage(progress.language)?.monaco ?? "javascript"}
                  value={code}
                  onChange={(next) => updateProgress({ code: next })}
                  fontSize={14}
                  vimMode={false}
                />
              </div>
              {(runOutput || running) && (
                <pre className="max-h-36 shrink-0 overflow-auto border-t bg-muted/40 p-3 font-mono text-xs">
                  {running ? "Running..." : runOutput}
                </pre>
              )}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}

/** Records the user's screen locally via MediaRecorder; nothing is uploaded */
function ScreenRecorder() {
  const [recording, setRecording] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  async function start() {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        setDownloadUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((track) => track.stop());
        setRecording(false);
      };
      stream.getVideoTracks()[0].addEventListener("ended", () => {
        if (recorder.state !== "inactive") recorder.stop();
      });
      recorder.start(1000);
      recorderRef.current = recorder;
      setDownloadUrl(null);
      setRecording(true);
    } catch {
      toast.error("Screen recording was blocked or cancelled");
    }
  }

  function stop() {
    recorderRef.current?.stop();
  }

  return (
    <div className="flex items-center gap-1.5">
      {recording ? (
        <Button variant="outline" size="sm" onClick={stop}>
          <Square className="size-3.5 text-destructive" /> Stop recording
        </Button>
      ) : (
        <Button variant="outline" size="sm" onClick={start}>
          <Video className="size-3.5" /> Record screen
        </Button>
      )}
      {downloadUrl && (
        <Button asChild variant="ghost" size="sm">
          <a href={downloadUrl} download="mock-interview.webm">
            <Download className="size-3.5" /> Save recording
          </a>
        </Button>
      )}
    </div>
  );
}

function ReportScreen({
  report,
  loading,
  questions,
  progressMap,
  onRestart,
}: {
  report: string;
  loading: boolean;
  questions: InterviewQuestion[];
  progressMap: Record<string, QuestionProgress>;
  onRestart: () => void;
}) {
  const solvedCount = questions.filter(
    (question) => progressMap[question.id]?.solved,
  ).length;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Card>
        <CardHeader>
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10">
            <FileText className="size-5 text-primary" />
          </div>
          <CardTitle className="text-xl">Interview Report</CardTitle>
          <CardDescription>
            You solved {solvedCount}/{questions.length} questions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              The AI coach is reviewing your performance...
            </div>
          ) : (
            <Markdown>{report}</Markdown>
          )}
          <Button variant="outline" onClick={onRestart}>
            Start another interview
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
