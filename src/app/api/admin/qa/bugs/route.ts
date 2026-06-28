import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/api-auth";
import { BugReport } from "@/models";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  await connectDB();
  const status = req.nextUrl.searchParams.get("status");
  const severity = req.nextUrl.searchParams.get("severity");
  const query: Record<string, unknown> = {};
  if (status && status !== "all") query.status = status;
  if (severity && severity !== "all") query.severity = severity;

  const items = await BugReport.find(query).sort({ createdAt: -1 }).limit(500).lean();
  const counts = await BugReport.aggregate<{ _id: string; n: number }>([
    { $group: { _id: "$status", n: { $sum: 1 } } },
  ]);
  const byStatus = Object.fromEntries(counts.map((c) => [c._id, c.n]));

  return NextResponse.json({
    items: items.map((b) => ({
      id: b._id.toString(),
      title: b.title,
      area: b.area,
      severity: b.severity,
      steps: b.steps,
      expected: b.expected ?? "",
      actual: b.actual ?? "",
      environment: b.environment ?? "",
      url: b.url ?? "",
      screenshotUrl: b.screenshotUrl ?? "",
      status: b.status,
      adminNote: b.adminNote ?? "",
      reporterName: b.reporterName ?? "",
      createdAt: b.createdAt,
    })),
    counts: {
      new: byStatus.new ?? 0,
      triaged: byStatus.triaged ?? 0,
      in_progress: byStatus.in_progress ?? 0,
      fixed: byStatus.fixed ?? 0,
      wontfix: byStatus.wontfix ?? 0,
      duplicate: byStatus.duplicate ?? 0,
    },
  });
}
