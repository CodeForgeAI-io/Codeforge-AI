import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getLanguage } from "@/lib/constants";
import { compilerRequestSchema } from "@/schemas/execution";
import { getExecutionProvider } from "@/services/execution";
import { getPostHogServer } from "@/lib/posthog-server";

export const maxDuration = 60;

/** Execute arbitrary code with optional stdin. No question or test cases needed. */
export async function POST(req: NextRequest) {
  const { session, error } = await requireUser();
  if (error) return error;

  const limited = await enforceRateLimit("execute", req, session.user.id);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = compilerRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
    );
  }

  const language = getLanguage(parsed.data.language);
  if (!language) {
    return NextResponse.json({ error: "Unsupported language" }, { status: 400 });
  }

  const provider = getExecutionProvider();
  const result = await provider.execute({
    language,
    code: parsed.data.code,
    stdin: parsed.data.stdin,
  });

  const posthog = getPostHogServer();
  posthog?.capture({
    distinctId: session.user.id,
    event: "compiler_run",
    properties: {
      language: language.id,
      status: result.status,
      runtime_ms: result.timeMs,
    },
  });

  return NextResponse.json({
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
    timeMs: result.timeMs,
    memoryKb: result.memoryKb,
  });
}
