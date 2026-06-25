import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/api-auth";
import { Coupon } from "@/models";

export const runtime = "nodejs";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Only allow a safe subset to be updated (never the code or usedCount).
  const update: Record<string, unknown> = {};
  if (typeof body.active === "boolean") update.active = body.active;
  if (typeof body.description === "string") update.description = body.description.slice(0, 200);
  if (body.value != null) update.value = Math.max(0, Number(body.value));
  if (body.type === "percent" || body.type === "flat") update.type = body.type;
  if (body.minAmount != null) update.minAmount = Math.max(0, Number(body.minAmount));
  if (body.maxRedemptions != null) update.maxRedemptions = Number(body.maxRedemptions);
  if (typeof body.oncePerUser === "boolean") update.oncePerUser = body.oncePerUser;
  if (Array.isArray(body.plans)) update.plans = body.plans.filter((p) => p === "go" || p === "plus");
  if ("expiresAt" in body) update.expiresAt = body.expiresAt ? new Date(String(body.expiresAt)) : null;

  await connectDB();
  await Coupon.updateOne({ _id: id }, { $set: update });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  await connectDB();
  await Coupon.deleteOne({ _id: id });
  return NextResponse.json({ ok: true });
}
