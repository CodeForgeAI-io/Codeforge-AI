import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { cached } from "@/lib/redis";
import { getAdminMetrics } from "@/services/admin-stats";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const data = await cached("admin:metrics", 60, getAdminMetrics);
  return NextResponse.json(data);
}
