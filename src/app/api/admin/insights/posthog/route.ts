import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { cached } from "@/lib/redis";
import { getPostHogInsights } from "@/services/insights";

export const dynamic = "force-dynamic";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  const data = await cached("admin:insights:posthog", 30, getPostHogInsights);
  return NextResponse.json(data);
}
