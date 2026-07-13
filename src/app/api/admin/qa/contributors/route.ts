import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { adminListContributors } from "@/services/qa-store";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const status = req.nextUrl.searchParams.get("status") ?? undefined;
  const { items, counts: byStatus } = await adminListContributors({ status });

  return NextResponse.json({
    items,
    counts: {
      pending: byStatus.pending ?? 0,
      approved: byStatus.approved ?? 0,
      rejected: byStatus.rejected ?? 0,
    },
  });
}
