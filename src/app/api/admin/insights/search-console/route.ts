import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { cached } from "@/lib/redis";
import { getSearchConsoleInsights } from "@/services/insights";

export const dynamic = "force-dynamic";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  // GSC data lags ~2 days; cache for an hour.
  const data = await cached("admin:insights:gsc", 3600, getSearchConsoleInsights);
  return NextResponse.json(data);
}
