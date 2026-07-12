import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { listFeedback } from "@/services/feedback-store";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const status = req.nextUrl.searchParams.get("status") ?? undefined;
  const type = req.nextUrl.searchParams.get("type") ?? undefined;
  const { items, counts } = await listFeedback({ status, type });
  return NextResponse.json({ items, counts });
}
