import { cache } from "@/lib/redis";
import { EXECUTION_LIMITS } from "@/lib/constants";
import type {
  ExecutionProvider,
  ExecutionRequest,
  ExecutionResult,
} from "./types";

const PISTON_URL = process.env.PISTON_URL ?? "https://emkc.org/api/v2/piston";

interface PistonRuntime {
  language: string;
  version: string;
  aliases: string[];
}

interface PistonResponse {
  compile?: { stdout: string; stderr: string; code: number | null };
  run: {
    stdout: string;
    stderr: string;
    code: number | null;
    signal: string | null;
  };
  message?: string;
}

let runtimesPromise: Promise<PistonRuntime[]> | null = null;

async function getRuntimes(): Promise<PistonRuntime[]> {
  const cacheKey = "piston:runtimes";
  const hit = await cache.get<PistonRuntime[]>(cacheKey);
  if (hit) return hit;

  if (!runtimesPromise) {
    runtimesPromise = fetch(`${PISTON_URL}/runtimes`, {
      headers: { Accept: "application/json" },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Piston runtimes failed: ${res.status}`);
        return (await res.json()) as PistonRuntime[];
      })
      .finally(() => {
        runtimesPromise = null;
      });
  }
  const runtimes = await runtimesPromise;
  await cache.set(cacheKey, runtimes, 60 * 60 * 12);
  return runtimes;
}

async function resolveVersion(pistonLanguage: string): Promise<string> {
  const runtimes = await getRuntimes();
  const runtime = runtimes.find(
    (r) =>
      r.language === pistonLanguage || r.aliases.includes(pistonLanguage),
  );
  if (!runtime) {
    throw new Error(`Piston runtime not found for "${pistonLanguage}"`);
  }
  return runtime.version;
}

export const pistonProvider: ExecutionProvider = {
  name: "piston",

  async execute({
    language,
    code,
    stdin,
  }: ExecutionRequest): Promise<ExecutionResult> {
    let version: string;
    try {
      version = await resolveVersion(language.piston);
    } catch {
      return {
        status: "internal_error",
        stdout: "",
        stderr: `The execution sandbox does not currently support ${language.label}.`,
        timeMs: null,
        memoryKb: null,
      };
    }

    const started = Date.now();
    let res: Response;
    try {
      res = await fetch(`${PISTON_URL}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: language.piston,
          version,
          files: [{ name: `main.${language.extension}`, content: code }],
          stdin,
          run_timeout: EXECUTION_LIMITS.timeoutMs,
          compile_timeout: EXECUTION_LIMITS.timeoutMs,
        }),
        signal: AbortSignal.timeout(EXECUTION_LIMITS.timeoutMs * 3),
      });
    } catch {
      return {
        status: "internal_error",
        stdout: "",
        stderr: "Could not reach the code execution service. Try again.",
        timeMs: null,
        memoryKb: null,
      };
    }
    const elapsed = Date.now() - started;

    if (res.status === 429) {
      return {
        status: "internal_error",
        stdout: "",
        stderr:
          "The execution service is busy (rate limited). Wait a moment and try again.",
        timeMs: null,
        memoryKb: null,
      };
    }
    if (!res.ok) {
      return {
        status: "internal_error",
        stdout: "",
        stderr: `Execution service error (${res.status}).`,
        timeMs: null,
        memoryKb: null,
      };
    }

    const data = (await res.json()) as PistonResponse;

    if (data.compile && data.compile.code !== 0 && data.compile.code !== null) {
      return {
        status: "compile_error",
        stdout: data.compile.stdout ?? "",
        stderr: data.compile.stderr || "Compilation failed",
        timeMs: elapsed,
        memoryKb: null,
      };
    }

    const run = data.run;
    if (run.signal === "SIGKILL") {
      return {
        status: "timeout",
        stdout: run.stdout ?? "",
        stderr: "Time limit exceeded",
        timeMs: elapsed,
        memoryKb: null,
      };
    }
    if (run.code !== 0) {
      return {
        status: "runtime_error",
        stdout: run.stdout ?? "",
        stderr: run.stderr || `Process exited with code ${run.code}`,
        timeMs: elapsed,
        memoryKb: null,
      };
    }

    return {
      status: "success",
      stdout: run.stdout ?? "",
      stderr: run.stderr ?? "",
      timeMs: elapsed,
      memoryKb: null,
    };
  },
};
