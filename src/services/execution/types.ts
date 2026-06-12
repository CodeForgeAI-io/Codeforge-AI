import type { LanguageConfig } from "@/lib/constants";

export type ExecutionStatus =
  | "success"
  | "compile_error"
  | "runtime_error"
  | "timeout"
  | "internal_error";

export interface ExecutionRequest {
  language: LanguageConfig;
  code: string;
  stdin: string;
}

export interface ExecutionResult {
  status: ExecutionStatus;
  stdout: string;
  stderr: string;
  timeMs: number | null;
  memoryKb: number | null;
}

export interface ExecutionProvider {
  name: string;
  execute(request: ExecutionRequest): Promise<ExecutionResult>;
}
