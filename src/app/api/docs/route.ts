import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { openApiSpec } from "@/lib/openapi";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(openApiSpec);
}
