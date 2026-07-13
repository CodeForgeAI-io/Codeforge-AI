import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { adminListUsers } from "@/services/user-store";

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const q = req.nextUrl.searchParams.get("q")?.trim() || undefined;
  const planFilter = req.nextUrl.searchParams.get("plan") || undefined;

  const users = await adminListUsers({ q, plan: planFilter });
  return NextResponse.json({ users });
}
