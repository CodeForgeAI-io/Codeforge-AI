import { NextResponse } from "next/server";
import { cached } from "@/lib/redis";
import { getSystemStatus } from "@/services/status";

export const dynamic = "force-dynamic";

/**
 * Public system status. Cached for 30s so traffic to /status never turns into
 * a burst of health checks against our own dependencies.
 */
export async function GET() {
  const data = await cached("public:status", 30, getSystemStatus);
  return NextResponse.json(data, {
    headers: { "Cache-Control": "public, max-age=0, s-maxage=30, stale-while-revalidate=60" },
  });
}
