import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { listToolRuns, upsertToolRun } from "@/services/ai-store";

const KEEP_PER_TOOL = 20;

/** List recent saved runs for a tool: GET /api/ai/history?tool=roadmap */
export async function GET(req: NextRequest) {
  const { session, error } = await requireUser();
  if (error) return error;

  const tool = req.nextUrl.searchParams.get("tool");
  if (!tool) {
    return NextResponse.json({ error: "tool is required" }, { status: 400 });
  }

  const runs = await listToolRuns(session.user.id, tool, KEEP_PER_TOOL);
  return NextResponse.json({
    runs: runs.map((r) => ({
      id: r.id,
      title: r.title,
      result: r.result,
      createdAt: r.createdAt,
    })),
  });
}

/** Save a run: POST /api/ai/history { tool, title, input?, result } */
export async function POST(req: NextRequest) {
  const { session, error } = await requireUser();
  if (error) return error;

  let body: { id?: string; tool?: string; title?: string; input?: unknown; result?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const tool = String(body.tool ?? "").trim();
  const title = String(body.title ?? "").trim().slice(0, 200) || "Untitled";
  if (!tool || body.result == null) {
    return NextResponse.json({ error: "tool and result are required" }, { status: 400 });
  }

  const id = await upsertToolRun({
    id: body.id,
    userId: session.user.id,
    tool,
    title,
    input: body.input,
    result: body.result,
    keep: KEEP_PER_TOOL,
  });

  return NextResponse.json({ id });
}
