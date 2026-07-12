"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Bot,
  CloudUpload,
  Maximize2,
  Minimize2,
  Play,
  RotateCcw,
  Settings2,
  Sparkles,
} from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LANGUAGES, getLanguage, type LanguageId } from "@/lib/constants";
import { useWorkspaceStore } from "@/store/workspace";
import type { QuestionDetail } from "@/services/questions";
import { CodeEditor } from "./code-editor";
import { TestResults, type DisplayTestResult } from "./test-results";
import { RunVisualizer } from "./run-visualizer";
import { QuestionPanel } from "./question-panel";
import { MentorPanel } from "@/features/ai-mentor/mentor-panel";

interface RunResponse {
  custom: boolean;
  results: DisplayTestResult[];
  passedCount: number;
  totalCount: number;
}

interface SubmitResponse {
  status: string;
  passedCount: number;
  totalCount: number;
  results: DisplayTestResult[];
  rewards: {
    xpEarned: number;
    newLevel: number | null;
    streak: number;
    newBadges: { name: string; description: string }[];
  } | null;
}

export function Workspace({
  question,
  contestSlug,
  signedIn = true,
}: {
  question: QuestionDetail;
  contestSlug?: string;
  signedIn?: boolean;
}) {
  const store = useWorkspaceStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const [lastFailure, setLastFailure] = useState("");
  const [resultsState, setResultsState] = useState<{
    status: string | null;
    results: DisplayTestResult[];
    passedCount: number;
    totalCount: number;
    custom: boolean;
  }>({ status: null, results: [], passedCount: 0, totalCount: 0, custom: false });

  const availableLanguages = LANGUAGES;

  const language = useMemo<LanguageId>(() => {
    return availableLanguages.some((lang) => lang.id === store.language)
      ? store.language
      : (availableLanguages[0]?.id ?? "javascript");
  }, [store.language, availableLanguages]);

  const starterFor = useCallback(
    (lang: LanguageId) =>
      question.starterCode[lang] ?? getLanguage(lang)?.defaultSnippet ?? "",
    [question.starterCode],
  );

  const [code, setCode] = useState(
    () => store.getDraft(question.id, language) ?? starterFor(language),
  );

  // Auto-save drafts (debounced)
  useEffect(() => {
    const handle = setTimeout(() => {
      store.saveDraft(question.id, language, code);
    }, 600);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, question.id, language]);

  function switchLanguage(next: string) {
    const nextLang = next as LanguageId;
    store.saveDraft(question.id, language, code);
    store.setLanguage(nextLang);
    setCode(store.getDraft(question.id, nextLang) ?? starterFor(nextLang));
  }

  function resetCode() {
    store.clearDraft(question.id, language);
    setCode(starterFor(language));
    toast.info("Editor reset to starter code");
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().then(() => setFullscreen(true));
    } else {
      document.exitFullscreen().then(() => setFullscreen(false));
    }
  }

  const runMutation = useMutation({
    mutationFn: async (withCustomInput: boolean): Promise<RunResponse> => {
      const res = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: question.id,
          language,
          code,
          ...(withCustomInput ? { customInput } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Run failed");
      return data;
    },
    onSuccess: (data) => {
      setResultsState({
        status: data.custom
          ? "Ran with custom input"
          : data.passedCount === data.totalCount
            ? "All sample tests passed"
            : "Some tests failed",
        results: data.results,
        passedCount: data.passedCount,
        totalCount: data.totalCount,
        custom: data.custom,
      });
      captureFailure(data.results);
    },
    onError: (mutationError: Error) => toast.error(mutationError.message),
  });

  const submitMutation = useMutation({
    mutationFn: async (): Promise<SubmitResponse> => {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: question.id,
          language,
          code,
          ...(contestSlug ? { contestSlug } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Submission failed");
      return data;
    },
    onSuccess: (data) => {
      setResultsState({
        status: data.status,
        results: data.results,
        passedCount: data.passedCount,
        totalCount: data.totalCount,
        custom: false,
      });
      captureFailure(data.results);
      if (data.status === "Accepted") {
        const rewards = data.rewards;
        toast.success(
          rewards && rewards.xpEarned > 0
            ? `Accepted! +${rewards.xpEarned} XP · ${rewards.streak} day streak`
            : "Accepted!",
        );
        if (rewards?.newLevel) {
          toast.success(`Level up! You reached level ${rewards.newLevel} 🎉`);
        }
        for (const badge of rewards?.newBadges ?? []) {
          toast.success(`Badge earned: ${badge.name} — ${badge.description}`);
        }
      } else {
        toast.error(`${data.status} — ${data.passedCount}/${data.totalCount} tests passed`);
      }
    },
    onError: (mutationError: Error) => toast.error(mutationError.message),
  });

  function captureFailure(results: DisplayTestResult[]) {
    const failed = results.find((r) => r.passed === false && !r.hidden);
    setLastFailure(
      failed
        ? `Input:\n${failed.input}\nExpected:\n${failed.expected}\nActual output:\n${failed.actual}\nStderr:\n${failed.stderr ?? ""}`
        : "",
    );
  }

  const busy = runMutation.isPending || submitMutation.isPending;

  const editorPane = (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-1.5 border-b px-2 py-1.5">
        <Select value={language} onValueChange={switchLanguage}>
          <SelectTrigger size="sm" className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableLanguages.map((lang) => (
              <SelectItem key={lang.id} value={lang.id}>
                {lang.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Editor settings">
              <Settings2 className="size-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 space-y-4" align="start">
            <div className="space-y-2">
              <Label className="text-xs">Font size: {store.fontSize}px</Label>
              <Slider
                value={[store.fontSize]}
                min={10}
                max={24}
                step={1}
                onValueChange={([value]) => store.setFontSize(value)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">Vim mode</Label>
              <Switch
                checked={store.vimMode}
                onCheckedChange={store.setVimMode}
              />
            </div>
          </PopoverContent>
        </Popover>

        <Button variant="ghost" size="icon" onClick={resetCode} aria-label="Reset code">
          <RotateCcw className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleFullscreen}
          aria-label="Toggle fullscreen"
        >
          {fullscreen ? (
            <Minimize2 className="size-4" />
          ) : (
            <Maximize2 className="size-4" />
          )}
        </Button>

        <div className="ml-auto flex items-center gap-1.5">
          {signedIn ? (
            <>
              <Button
                variant={aiOpen ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setAiOpen((open) => !open)}
              >
                <Bot className="size-4" /> AI Mentor
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={busy}
                onClick={() => runMutation.mutate(false)}
              >
                <Play className="size-4" /> Run
              </Button>
              <Button
                size="sm"
                disabled={busy}
                onClick={() => submitMutation.mutate()}
              >
                <CloudUpload className="size-4" /> Submit
              </Button>
            </>
          ) : (
            <Button asChild size="sm">
              <a href={`/login?callbackUrl=/problems/${question.slug}`}>
                Sign in to run code
              </a>
            </Button>
          )}
        </div>
      </div>
      <div className="min-h-0 flex-1">
        <CodeEditor
          language={getLanguage(language)?.monaco ?? "javascript"}
          value={code}
          onChange={setCode}
          fontSize={store.fontSize}
          vimMode={store.vimMode}
        />
      </div>
    </div>
  );

  const resultsPane = (
    <Tabs defaultValue="results" className="flex h-full flex-col gap-0">
      <TabsList className="m-1.5 w-fit">
        <TabsTrigger value="results">Test Results</TabsTrigger>
        <TabsTrigger value="custom">Custom Input</TabsTrigger>
        <TabsTrigger value="visualize" className="gap-1">
          <Sparkles className="size-3.5" /> Visualize
        </TabsTrigger>
      </TabsList>
      <TabsContent value="results" className="min-h-0 flex-1">
        <TestResults
          running={busy}
          status={resultsState.status}
          results={resultsState.results}
          passedCount={resultsState.passedCount}
          totalCount={resultsState.totalCount}
          custom={resultsState.custom}
        />
      </TabsContent>
      <TabsContent value="custom" className="min-h-0 flex-1 p-2">
        <div className="flex h-full flex-col gap-2">
          <Textarea
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder="Provide stdin for your program..."
            className="flex-1 resize-none font-mono text-xs"
          />
          <Button
            size="sm"
            variant="secondary"
            className="self-start"
            disabled={busy}
            onClick={() => runMutation.mutate(true)}
          >
            <Play className="size-4" /> Run with custom input
          </Button>
        </div>
      </TabsContent>
      <TabsContent value="visualize" className="min-h-0 flex-1">
        <RunVisualizer
          slug={question.slug}
          code={code}
          language={language}
          results={resultsState.results}
          signedIn={signedIn}
        />
      </TabsContent>
    </Tabs>
  );

  return (
    <div ref={containerRef} className="h-[calc(100svh-3.5rem)] bg-background">
      {/* Desktop: resizable split view */}
      <div className="hidden h-full md:block">
        <ResizablePanelGroup orientation="horizontal">
          <ResizablePanel defaultSize="38%" minSize="24%">
            <QuestionPanel question={question} />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={aiOpen ? "42%" : "62%"} minSize="30%">
            <ResizablePanelGroup orientation="vertical">
              <ResizablePanel defaultSize="68%" minSize="30%">
                {editorPane}
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize="32%" minSize="15%">
                {resultsPane}
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
          {aiOpen && (
            <>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize="20%" minSize="16%">
                <MentorPanel
                  context="question"
                  questionId={question.id}
                  code={code}
                  language={language}
                  failureContext={lastFailure}
                  onClose={() => setAiOpen(false)}
                />
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>

      {/* Mobile: stacked tabs */}
      <div className="h-full md:hidden">
        <Tabs defaultValue="problem" className="flex h-full flex-col gap-0">
          <TabsList className="m-2 w-fit self-center">
            <TabsTrigger value="problem">Problem</TabsTrigger>
            <TabsTrigger value="code">Code</TabsTrigger>
            {signedIn && <TabsTrigger value="ai">AI</TabsTrigger>}
          </TabsList>
          <TabsContent value="problem" className="min-h-0 flex-1">
            <QuestionPanel question={question} />
          </TabsContent>
          <TabsContent value="code" className="min-h-0 flex-1">
            <ResizablePanelGroup orientation="vertical">
              <ResizablePanel defaultSize="65%" minSize="30%">
                {editorPane}
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize="35%" minSize="15%">
                {resultsPane}
              </ResizablePanel>
            </ResizablePanelGroup>
          </TabsContent>
          {signedIn && (
            <TabsContent value="ai" className="min-h-0 flex-1">
              <MentorPanel
                context="question"
                questionId={question.id}
                code={code}
                language={language}
                failureContext={lastFailure}
              />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
