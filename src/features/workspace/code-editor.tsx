"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import type { editor } from "monaco-editor";
import type { Monaco } from "@monaco-editor/react";
import { Skeleton } from "@/components/ui/skeleton";

const MonacoEditor = dynamic(
  () => import("@monaco-editor/react").then((mod) => mod.default),
  {
    ssr: false,
    loading: () => <Skeleton className="h-full w-full rounded-none" />,
  },
);

interface CodeEditorProps {
  language: string;
  value: string;
  onChange: (value: string) => void;
  fontSize: number;
  vimMode: boolean;
  /** Enable Emmet abbreviations (html/css editing) */
  emmet?: boolean;
  readOnly?: boolean;
}

export function CodeEditor({
  language,
  value,
  onChange,
  fontSize,
  vimMode,
  emmet = false,
  readOnly = false,
}: CodeEditorProps) {
  const { resolvedTheme } = useTheme();
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const vimRef = useRef<{ dispose(): void } | null>(null);
  const vimStatusRef = useRef<HTMLDivElement>(null);

  // Toggle vim mode on the live editor instance
  useEffect(() => {
    let cancelled = false;
    async function applyVim() {
      vimRef.current?.dispose();
      vimRef.current = null;
      if (vimMode && editorRef.current) {
        const { initVimMode } = await import("monaco-vim");
        if (!cancelled && editorRef.current) {
          vimRef.current = initVimMode(
            editorRef.current,
            vimStatusRef.current,
          );
        }
      }
    }
    applyVim();
    return () => {
      cancelled = true;
      vimRef.current?.dispose();
      vimRef.current = null;
    };
  }, [vimMode]);

  async function handleMount(
    editorInstance: editor.IStandaloneCodeEditor,
    monaco: Monaco,
  ) {
    editorRef.current = editorInstance;
    if (emmet) {
      const { emmetHTML, emmetCSS, emmetJSX } = await import("emmet-monaco-es");
      emmetHTML(monaco);
      emmetCSS(monaco);
      emmetJSX(monaco);
    }
    if (vimMode) {
      const { initVimMode } = await import("monaco-vim");
      vimRef.current = initVimMode(editorInstance, vimStatusRef.current);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1">
        <MonacoEditor
          language={language}
          value={value}
          onChange={(next) => onChange(next ?? "")}
          onMount={handleMount}
          theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
          options={{
            fontSize,
            fontFamily: "var(--font-geist-mono), 'Fira Code', monospace",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: "on",
            padding: { top: 12 },
            quickSuggestions: true,
            suggestOnTriggerCharacters: true,
            renderLineHighlight: "line",
            cursorBlinking: "smooth",
            smoothScrolling: true,
            readOnly,
          }}
        />
      </div>
      <div
        ref={vimStatusRef}
        className={`shrink-0 border-t bg-muted/50 px-3 font-mono text-xs leading-6 ${
          vimMode ? "block" : "hidden"
        }`}
      />
    </div>
  );
}
