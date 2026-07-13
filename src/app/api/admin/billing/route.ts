import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { getAdminBilling } from "@/services/admin-stats";

/** Admin view: every user's plan, AI credit usage and payment totals. */
export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const q = req.nextUrl.searchParams.get("q")?.trim() || undefined;
  const planFilter = req.nextUrl.searchParams.get("plan") || undefined;

  const data = await getAdminBilling({ q, plan: planFilter });
  return NextResponse.json(data);
}
