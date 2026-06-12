import { EXECUTION_LIMITS } from "@/lib/constants";
import type {
  ExecutionProvider,
  ExecutionRequest,
  ExecutionResult,
} from "./types";

/**
 * paiza.io runner — free public API (guest key), supports all 12 platform
 * languages including Kotlin. Asynchronous: create a runner then poll for
 * completion.
 */
const PAIZA_URL = process.env.PAIZA_URL ?? "https://api.paiza.io";
const PAIZA_API_KEY = process.env.PAIZA_API_KEY ?? "guest";

const POLL_INTERVAL_MS = 700;
const MAX_POLLS = 45;

/** Our language id -> paiza language code */
const PAIZA_LANGUAGES: Record<string, string> = {
  javascript: "javascript",
  typescript: "typescript",
  python: "python3",
  java: "java",
  c: "c",
  cpp: "cpp",
  csharp: "csharp",
  go: "go",
  php: "php",
  rust: "rust",
  kotlin: "kotlin",
  swift: "swift",
};

interface PaizaDetails {
  id: string;
  status: "running" | "completed";
  build_stderr: string | null;
  build_exit_code: number | null;
  build_result: "success" | "failure" | null;
  stdout: string | null;
  stderr: string | null;
  /** paiza returns this as a string, e.g. "0" */
  exit_code: number | string | null;
  result: "success" | "failure" | "timeout" | null;
  time: string | null;
  memory: number | null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function internalError(message: string): ExecutionResult {
  return {
    status: "internal_error",
    stdout: "",
    stderr: message,
    timeMs: null,
    memoryKb: null,
  };
}

export const paizaProvider: ExecutionProvider = {
  name: "paiza",

  async execute({
    language,
    code,
    stdin,
  }: ExecutionRequest): Promise<ExecutionResult> {
    const paizaLanguage = PAIZA_LANGUAGES[language.id];
    if (!paizaLanguage) {
      return internalError(
        `The execution sandbox does not currently support ${language.label}.`,
      );
    }

    let createdId: string;
    try {
      const create = await fetch(`${PAIZA_URL}/runners/create`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          source_code: code,
          language: paizaLanguage,
          input: stdin,
          longpoll: "true",
          longpoll_timeout: "10",
          api_key: PAIZA_API_KEY,
        }),
        signal: AbortSignal.timeout(EXECUTION_LIMITS.timeoutMs * 2),
      });
      if (create.status === 429) {
        return internalError(
          "The execution service is busy (rate limited). Wait a moment and try again.",
        );
      }
      const created = (await create.json()) as { id?: string; error?: string };
      if (!created.id) {
        return internalError(created.error ?? "Execution service rejected the run.");
      }
      createdId = created.id;
    } catch {
      return internalError(
        "Could not reach the code execution service. Try again.",
      );
    }

    let details: PaizaDetails | null = null;
    for (let attempt = 0; attempt < MAX_POLLS; attempt++) {
      await sleep(POLL_INTERVAL_MS);
      try {
        const res = await fetch(
          `${PAIZA_URL}/runners/get_details?id=${createdId}&api_key=${PAIZA_API_KEY}`,
          { signal: AbortSignal.timeout(15_000) },
        );
        const body = (await res.json()) as PaizaDetails;
        if (body.status === "completed") {
          details = body;
          break;
        }
      } catch {
        // transient poll failure; keep trying until MAX_POLLS
      }
    }

    if (!details) {
      return {
        status: "timeout",
        stdout: "",
        stderr: "Time limit exceeded",
        timeMs: null,
        memoryKb: null,
      };
    }

    const timeMs = details.time
      ? Math.round(parseFloat(details.time) * 1000)
      : null;
    const memoryKb =
      typeof details.memory === "number"
        ? Math.round(details.memory / 1024)
        : null;

    if (details.build_result === "failure") {
      return {
        status: "compile_error",
        stdout: "",
        stderr: details.build_stderr || "Compilation failed",
        timeMs,
        memoryKb,
      };
    }
    if (details.result === "timeout") {
      return {
        status: "timeout",
        stdout: details.stdout ?? "",
        stderr: "Time limit exceeded",
        timeMs,
        memoryKb,
      };
    }
    const exitCode = Number(details.exit_code ?? 0);
    if (exitCode !== 0) {
      return {
        status: "runtime_error",
        stdout: details.stdout ?? "",
        stderr: details.stderr || `Process exited with code ${exitCode}`,
        timeMs,
        memoryKb,
      };
    }

    return {
      status: "success",
      stdout: details.stdout ?? "",
      stderr: details.stderr ?? "",
      timeMs,
      memoryKb,
    };
  },
};
