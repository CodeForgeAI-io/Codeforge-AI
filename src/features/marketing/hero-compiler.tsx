"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Loader2, Play, RotateCcw } from "@/components/icons";
import { cn } from "@/lib/utils";

const ACCENT = "#006bff";

const DEFAULT_CODE = `// Two Sum — edit me, then hit Run ▶
function twoSum(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (seen.has(need)) return [seen.get(need), i];
    seen.set(nums[i], i);
  }
  return [];
}

console.log(twoSum([2, 7, 11, 15], 9));
console.log("Runs right here in your browser 🚀");
`;

interface OutLine {
  type: "log" | "error" | "warn" | "info";
  text: string;
}

/** Sandboxed Web Worker that executes the visitor's code. Served from its own
 *  same-origin route so it can carry a worker-scoped CSP that permits eval —
 *  a blob: worker would inherit the document's strict, eval-free policy. */
const WORKER_URL = "/api/js-runner";

/** A real, working JavaScript playground for the landing hero. Code runs
 *  client-side in a Web Worker — no login, no server cost, hard 3s timeout. */
export function HeroCompiler() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [out, setOut] = useState<OutLine[]>([]);
  const [ms, setMs] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stop = useCallback(() => {
    workerRef.current?.terminate();
    workerRef.current = null;
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  useEffect(() => stop, [stop]);

  const run = useCallback(() => {
    stop();
    setOut([]);
    setMs(null);
    setRunning(true);

    const worker = new Worker(WORKER_URL);
    workerRef.current = worker;

    worker.onmessage = (e) => {
      const msg = e.data as { type: string; text?: string; ms?: number };
      if (msg.type === "done") {
        setMs(msg.ms ?? null);
        setRunning(false);
        stop();
      } else {
        setOut((prev) =>
          prev.length >= 60
            ? prev
            : [...prev, { type: msg.type as OutLine["type"], text: msg.text ?? "" }],
        );
      }
    };
    worker.onerror = (e) => {
      setOut((prev) => [...prev, { type: "error", text: e.message || "Script error" }]);
      setRunning(false);
      stop();
    };

    // Hard timeout — infinite loops get terminated, the page stays healthy.
    timerRef.current = setTimeout(() => {
      setOut((prev) => [...prev, { type: "error", text: "Execution timed out (3s)" }]);
      setRunning(false);
      stop();
    }, 3000);

    worker.postMessage(code);
  }, [code, stop]);

  // Tab inserts two spaces instead of moving focus.
  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      run();
      return;
    }
    if (e.key === "Tab") {
      e.preventDefault();
      const el = e.currentTarget;
      const { selectionStart: s, selectionEnd: en, value } = el;
      setCode(value.slice(0, s) + "  " + value.slice(en));
      requestAnimationFrame(() => el.setSelectionRange(s + 2, s + 2));
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-black/[0.08] bg-white shadow-[0_24px_80px_rgba(0,40,120,0.18)] dark:border-white/10 dark:bg-[#0a0e1a] dark:shadow-[0_24px_80px_rgba(0,40,120,0.35)]">
      {/* title bar */}
      <div className="flex items-center gap-1.5 border-b border-black/[0.06] px-4 py-2.5 dark:border-white/10">
        <span className="size-2.5 rounded-full bg-[#ff5f57]" />
        <span className="size-2.5 rounded-full bg-[#febc2e]" />
        <span className="size-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-2 font-mono text-xs text-neutral-500">playground.js</span>
        <span className="ml-2 hidden rounded-md bg-black/[0.05] px-1.5 py-0.5 text-[10px] font-medium text-neutral-500 sm:inline dark:bg-white/10 dark:text-neutral-400">
          live · runs in your browser
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => { setCode(DEFAULT_CODE); setOut([]); setMs(null); }}
            title="Reset code"
            aria-label="Reset code"
            className="flex size-6 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-black/[0.05] hover:text-neutral-800 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={run}
            disabled={running}
            aria-label={running ? "Running code" : "Run code"}
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold text-white transition-opacity disabled:opacity-60"
            style={{ background: ACCENT }}
          >
            {running ? <Loader2 className="size-3 animate-spin" aria-hidden="true" /> : <Play className="size-3" aria-hidden="true" />}
            Run
          </button>
        </div>
      </div>

      {/* editor */}
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        onKeyDown={onKeyDown}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        aria-label="JavaScript playground editor"
        className="block h-56 w-full resize-none bg-transparent p-4 font-mono text-[11.5px] leading-relaxed text-neutral-700 outline-none sm:h-60 sm:px-5 sm:text-[12.5px] dark:text-neutral-300"
      />

      {/* output */}
      <div className="border-t border-black/[0.06] bg-neutral-950 px-4 py-3 font-mono text-[11.5px] leading-relaxed sm:px-5 dark:border-white/10 dark:bg-black/60">
        <div className="mb-1 flex items-center justify-between text-neutral-600">
          <span>{"// output"}</span>
          {ms !== null && (
            <span className="flex items-center gap-1.5 text-[10.5px] text-neutral-500">
              <span className="size-1.5 rounded-full bg-[#28c840]" /> finished in {ms} ms
            </span>
          )}
        </div>
        <div
          className="max-h-28 min-h-14 overflow-auto"
          role="status"
          aria-live="polite"
          aria-atomic="false"
          aria-label="Program output"
        >
          {out.length === 0 && !running && (
            <div className="text-neutral-600">Hit Run (or ⌘/Ctrl + Enter) to execute…</div>
          )}
          {out.map((line, i) => (
            <div key={i} className={cn("whitespace-pre-wrap break-all", line.type === "error" ? "text-red-400" : line.type === "warn" ? "text-amber-300" : "text-neutral-300")}>
              {line.text}
            </div>
          ))}
        </div>
      </div>

      {/* footer nudge */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-black/[0.06] px-4 py-2.5 text-xs text-neutral-500 sm:px-5 dark:border-white/10 dark:text-neutral-400">
        <span>JavaScript here — 12 languages inside.</span>
        <Link href="/compiler" className="font-medium underline-offset-4 hover:underline" style={{ color: ACCENT }}>
          Open the full compiler →
        </Link>
      </div>
    </div>
  );
}
