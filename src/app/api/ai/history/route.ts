import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { requireUser } from "@/lib/api-auth";
import { AiToolRun } from "@/models";

const KEEP_PER_TOOL = 20;

/** List recent saved runs for a tool: GET /api/ai/history?tool=roadmap */
export async function GET(req: NextRequest) {
  const { session, error } = await requireUser();
  if (error) return error;

  const tool = req.nextUrl.searchParams.get("tool");
  if (!tool) {
    return NextResponse.json({ error: "tool is required" }, { status: 400 });
  }

  await connectDB();
  const runs = await AiToolRun.find({
    user: new Types.ObjectId(session.user.id),
    tool,
  })
    .sort({ createdAt: -1 })
    .limit(KEEP_PER_TOOL)
    .select("title result createdAt")
    .lean();

  return NextResponse.json({
    runs: runs.map((r) => ({
      id: r._id.toString(),
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

  await connectDB();
  const userId = new Types.ObjectId(session.user.id);

  // Upsert: conversational tools update one run per session via `id`.
  if (body.id && Types.ObjectId.isValid(body.id)) {
    const updated = await AiToolRun.findOneAndUpdate(
      { _id: body.id, user: userId, tool },
      { title, input: body.input, result: body.result },
      { new: true },
    );
    if (updated) return NextResponse.json({ id: updated._id.toString() });
  }

  const run = await AiToolRun.create({
    user: userId,
    tool,
    title,
    input: body.input,
    result: body.result,
  });

  // Keep only the most recent N runs per user+tool.
  const stale = await AiToolRun.find({ user: userId, tool })
    .sort({ createdAt: -1 })
    .skip(KEEP_PER_TOOL)
    .select("_id")
    .lean();
  if (stale.length) {
    await AiToolRun.deleteMany({ _id: { $in: stale.map((s) => s._id) } });
  }

  return NextResponse.json({ id: run._id.toString() });
}
