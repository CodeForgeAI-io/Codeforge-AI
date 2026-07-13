import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { adminListBugs } from "@/services/qa-store";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const status = req.nextUrl.searchParams.get("status") ?? undefined;
  const severity = req.nextUrl.searchParams.get("severity") ?? undefined;
  const { items, counts: byStatus } = await adminListBugs({ status, severity });

  return NextResponse.json({
    items,
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
