import { EXECUTION_LIMITS } from "@/lib/constants";
import type {
  ExecutionProvider,
  ExecutionRequest,
  ExecutionResult,
} from "./types";

const JUDGE0_URL = process.env.JUDGE0_URL ?? "https://judge0-ce.p.rapidapi.com";

interface Judge0Response {
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  message: string | null;
  time: string | null;
  memory: number | null;
  status: { id: number; description: string };
}

/** Judge0 status ids: 3=Accepted, 5=TLE, 6=Compile error, 7-12=Runtime errors */
function mapStatus(id: number): ExecutionResult["status"] {
  if (id === 3) return "success";
  if (id === 4) return "success"; // wrong answer is decided by our comparator
  if (id === 5) return "timeout";
  if (id === 6) return "compile_error";
  if (id >= 7 && id <= 12) return "runtime_error";
  return "internal_error";
}

export const judge0Provider: ExecutionProvider = {
  name: "judge0",

  async execute({
    language,
    code,
    stdin,
  }: ExecutionRequest): Promise<ExecutionResult> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (process.env.JUDGE0_API_KEY) {
      headers["X-RapidAPI-Key"] = process.env.JUDGE0_API_KEY;
      headers["X-RapidAPI-Host"] = new URL(JUDGE0_URL).host;
    }

    let res: Response;
    try {
      res = await fetch(
        `${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            source_code: code,
            language_id: language.judge0,
            stdin,
            cpu_time_limit: EXECUTION_LIMITS.timeoutMs / 1000,
          }),
          signal: AbortSignal.timeout(EXECUTION_LIMITS.timeoutMs * 3),
        },
      );
    } catch {
      return {
        status: "internal_error",
        stdout: "",
        stderr: "Could not reach Judge0. Check JUDGE0_URL / JUDGE0_API_KEY.",
        timeMs: null,
        memoryKb: null,
      };
    }

    if (!res.ok) {
      return {
        status: "internal_error",
        stdout: "",
        stderr: `Judge0 error (${res.status}).`,
        timeMs: null,
        memoryKb: null,
      };
    }

    const data = (await res.json()) as Judge0Response;
    const status = mapStatus(data.status.id);

    return {
      status,
      stdout: data.stdout ?? "",
      stderr:
        status === "compile_error"
          ? (data.compile_output ?? "Compilation failed")
          : (data.stderr ?? data.message ?? ""),
      timeMs: data.time ? Math.round(parseFloat(data.time) * 1000) : null,
      memoryKb: data.memory,
    };
  },
};
