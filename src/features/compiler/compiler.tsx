"use client";

import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Loader2,
  Play,
  RotateCcw,
  Settings2,
  Terminal,
} from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { LANGUAGES, type LanguageId } from "@/lib/constants";
import { useWorkspaceStore } from "@/store/workspace";
import { CodeEditor } from "@/features/workspace/code-editor";
import { WebCompiler } from "@/features/compiler/web-compiler";
import { cn } from "@/lib/utils";

type CompilerMode = "language" | "web";
import type { ExecutionStatus } from "@/services/execution/types";

// ---------------------------------------------------------------------------
// Hello World starter code for each language
// ---------------------------------------------------------------------------

const HELLO_WORLD: Record<LanguageId, string> = {
  javascript: 'console.log("Hello, World!");\n',
  typescript: 'console.log("Hello, World!");\n',
  python: 'print("Hello, World!")\n',
  java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}\n',
  c: '#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}\n',
  cpp: '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}\n',
  csharp:
    'using System;\n\npublic class Program {\n    public static void Main() {\n        Console.WriteLine("Hello, World!");\n    }\n}\n',
  go: 'package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, World!")\n}\n',
  php: '<?php\necho "Hello, World!\\n";\n',
  rust: 'fn main() {\n    println!("Hello, World!");\n}\n',
  kotlin: 'fun main() {\n    println("Hello, World!")\n}\n',
  swift: 'print("Hello, World!")\n',
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OutputState {
  status: ExecutionStatus;
  stdout: string;
  stderr: string;
  timeMs: number | null;
  memoryKb: number | null;
}

type CompilerResponse = OutputState;

// ---------------------------------------------------------------------------
// Status badge helper
// ---------------------------------------------------------------------------

const STATUS_META: Record<
  ExecutionStatus,
  { label: string; className: string }
> = {
  success: { label: "Success", className: "text-green-600 border-green-600" },
  compile_error: { label: "Compile Error", className: "" },
  runtime_error: { label: "Runtime Error", className: "" },
  timeout: {
    label: "Time Limit Exceeded",
    className: "text-yellow-600 border-yellow-600",
  },
  internal_error: { label: "Internal Error", className: "" },
};

function StatusBadge({ status }: { status: ExecutionStatus }) {
  const meta = STATUS_META[status];
  const isDestructive =
    status === "compile_error" || status === "runtime_error";
  return (
    <Badge
      variant={isDestructive ? "destructive" : "outline"}
      className={cn("shrink-0", meta.className)}
    >
      {meta.label}
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Output field
// ---------------------------------------------------------------------------

function OutputField({
  label,
  value,
  error = false,
}: {
  label: string;
  value: string;
  error?: boolean;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <pre
        className={cn(
          "max-h-64 overflow-auto rounded border bg-muted/40 p-2 font-mono text-xs whitespace-pre-wrap break-all",
          error && "text-destructive",
        )}
      >
        {value}
      </pre>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Compiler component
// ---------------------------------------------------------------------------

export function Compiler() {
  const store = useWorkspaceStore();

  // The workspace store is persisted to localStorage, so the client's first
  // render can differ from the server-rendered default (saved language, font
  // size…). Render only after mount to avoid hydration mismatches.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [mode, setMode] = useState<CompilerMode>("language");
  const [language, setLanguage] = useState<LanguageId>(store.language);
  const [code, setCode] = useState<string>(
    () => HELLO_WORLD[store.language] ?? HELLO_WORLD.javascript,
  );
  const [stdin, setStdin] = useState("");
  const [output, setOutput] = useState<OutputState | null>(null);

  const langConfig = LANGUAGES.find((l) => l.id === language)!;

  function handleLanguageChange(next: string) {
    const nextId = next as LanguageId;
    setLanguage(nextId);
    store.setLanguage(nextId);
    setCode(HELLO_WORLD[nextId] ?? "");
    setOutput(null);
  }

  function handleReset() {
    setCode(HELLO_WORLD[language] ?? "");
    setOutput(null);
  }

  const runMutation = useMutation({
    mutationFn: async (): Promise<CompilerResponse> => {
      const res = await fetch("/api/compiler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, code, stdin }),
      });
      const data = (await res.json()) as CompilerResponse & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Execution failed");
      return data;
    },
    onSuccess: (data) => setOutput(data),
    onError: (err: Error) => toast.error(err.message),
  });

  // -------------------------------------------------------------------------
  // Shared sub-panels
  // -------------------------------------------------------------------------

  const editorToolbar = (
    <div className="flex shrink-0 items-center gap-2 border-b px-3 py-2">
      <Terminal className="size-4 shrink-0 text-muted-foreground" />
      <Select value={language} onValueChange={handleLanguageChange}>
        <SelectTrigger className="h-7 w-36 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {LANGUAGES.map((l) => (
            <SelectItem key={l.id} value={l.id} className="text-xs">
              {l.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Settings popover */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="size-7">
            <Settings2 className="size-3.5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 space-y-4 p-3" align="start">
          <div className="space-y-2">
            <Label className="text-xs">Font size: {store.fontSize}px</Label>
            <Slider
              min={10}
              max={24}
              step={1}
              value={[store.fontSize]}
              onValueChange={([v]) => store.setFontSize(v!)}
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

      <Button
        variant="ghost"
        size="icon"
        className="size-7"
        onClick={handleReset}
        title="Reset to Hello World"
      >
        <RotateCcw className="size-3.5" />
      </Button>

      <div className="ml-auto">
        <Button
          size="sm"
          className="h-7 gap-1.5 px-3 text-xs"
          onClick={() => runMutation.mutate()}
          disabled={runMutation.isPending}
        >
          {runMutation.isPending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Play className="size-3.5" />
          )}
          Run
        </Button>
      </div>
    </div>
  );

  const editorPane = (
    <div className="flex h-full flex-col">
      {editorToolbar}
      <div className="min-h-0 flex-1">
        <CodeEditor
          language={langConfig.monaco}
          value={code}
          onChange={setCode}
          fontSize={store.fontSize}
          vimMode={store.vimMode}
        />
      </div>
    </div>
  );

  const stdinPane = (
    <div className="flex h-full flex-col gap-1 p-2">
      <p className="shrink-0 text-xs font-medium text-muted-foreground">
        Standard Input (stdin)
      </p>
      <Textarea
        value={stdin}
        onChange={(e) => setStdin(e.target.value)}
        placeholder="Program input — one value per line…"
        className="flex-1 resize-none font-mono text-xs"
        spellCheck={false}
      />
    </div>
  );

  const outputPane = (
    <ScrollArea className="h-full">
      <div className="space-y-3 p-3">
        {runMutation.isPending && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Running your code…
          </div>
        )}

        {!runMutation.isPending && output === null && (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">
              Run your code to see output here.
            </p>
          </div>
        )}

        {!runMutation.isPending && output !== null && (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={output.status} />
              {output.timeMs !== null && (
                <span className="text-xs text-muted-foreground">
                  {output.timeMs} ms
                </span>
              )}
              {output.memoryKb !== null && (
                <span className="text-xs text-muted-foreground">
                  {output.memoryKb} KB
                </span>
              )}
            </div>

            {output.stdout && (
              <OutputField label="stdout" value={output.stdout} />
            )}
            {output.stderr && (
              <OutputField label="stderr" value={output.stderr} error />
            )}
            {!output.stdout && !output.stderr && output.status === "success" && (
              <p className="text-xs text-muted-foreground">(no output)</p>
            )}
          </>
        )}
      </div>
    </ScrollArea>
  );

  // -------------------------------------------------------------------------
  // Responsive layout
  // -------------------------------------------------------------------------

  if (!mounted) {
    return <div className="h-[calc(100svh-3.5rem)] animate-pulse bg-muted/20" />;
  }

  const modeSwitch = (
    <div className="flex shrink-0 items-center gap-1 border-b px-3 py-1.5">
      <div className="inline-flex rounded-lg border bg-muted/40 p-0.5">
        {(["language", "web"] as CompilerMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={cn(
              "rounded-md px-3 py-1 text-xs font-medium transition-colors",
              mode === m
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {m === "language" ? "Language" : "Web / React"}
          </button>
        ))}
      </div>
      <span className="ml-2 text-[11px] text-muted-foreground">
        {mode === "language"
          ? "Run 12 languages against custom input"
          : "HTML/CSS/JS · React (+ npm) · Next.js"}
      </span>
    </div>
  );

  return (
    <div className="flex h-[calc(100svh-3.5rem)] flex-col">
      {modeSwitch}

      {mode === "web" ? (
        <div className="min-h-0 flex-1">
          <WebCompiler />
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
      {/* Desktop: horizontal resizable split */}
      <div className="hidden h-full md:block">
        <ResizablePanelGroup orientation="horizontal" className="h-full">
          <ResizablePanel defaultSize="60%" minSize="30%">
            {editorPane}
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize="40%" minSize="25%">
            <ResizablePanelGroup orientation="vertical" className="h-full">
              <ResizablePanel defaultSize="35%" minSize="20%">
                {stdinPane}
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize="65%" minSize="25%">
                {outputPane}
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Mobile: tabs */}
      <div className="flex h-full flex-col md:hidden">
        {editorToolbar}
        <Tabs defaultValue="editor" className="flex min-h-0 flex-1 flex-col">
          <TabsList className="shrink-0 rounded-none border-b bg-transparent p-0">
            <TabsTrigger
              value="editor"
              className="rounded-none border-b-2 border-transparent px-4 py-2 text-xs data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              Editor
            </TabsTrigger>
            <TabsTrigger
              value="io"
              className="rounded-none border-b-2 border-transparent px-4 py-2 text-xs data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              I/O
            </TabsTrigger>
          </TabsList>
          <TabsContent value="editor" className="mt-0 min-h-0 flex-1">
            <div className="h-full">
              <CodeEditor
                language={langConfig.monaco}
                value={code}
                onChange={setCode}
                fontSize={store.fontSize}
                vimMode={store.vimMode}
              />
            </div>
          </TabsContent>
          <TabsContent
            value="io"
            className="mt-0 min-h-0 flex-1 overflow-auto"
          >
            <div className="flex h-full flex-col">
              <div className="flex-1 border-b">{stdinPane}</div>
              <div className="flex-1">{outputPane}</div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
        </div>
      )}
    </div>
  );
}
