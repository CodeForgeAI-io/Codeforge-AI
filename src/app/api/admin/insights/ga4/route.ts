import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { cached } from "@/lib/redis";
import { getGa4Insights } from "@/services/insights";

export const dynamic = "force-dynamic";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  const data = await cached("admin:insights:ga4", 30, getGa4Insights);
  return NextResponse.json(data);
}
