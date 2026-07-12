import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { listApplications } from "@/services/job-application-store";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const role = req.nextUrl.searchParams.get("role") ?? undefined;
  const status = req.nextUrl.searchParams.get("status") ?? undefined;
  const { items, counts } = await listApplications({ role, status });

  return NextResponse.json({
    items,
    counts: { total: items.length, ...counts },
  });
}
