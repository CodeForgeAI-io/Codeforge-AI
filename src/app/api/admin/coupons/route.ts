import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/api-auth";
import { Coupon } from "@/models";
import { normalizeCode } from "@/lib/coupons";

export const runtime = "nodejs";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  await connectDB();
  const coupons = await Coupon.find().sort({ createdAt: -1 }).limit(500).lean();
  return NextResponse.json({
    coupons: coupons.map((c) => ({
      id: c._id.toString(),
      code: c.code,
      description: c.description ?? "",
      type: c.type,
      value: c.value,
      minAmount: c.minAmount,
      maxRedemptions: c.maxRedemptions,
      usedCount: c.usedCount,
      oncePerUser: c.oncePerUser,
      plans: c.plans ?? [],
      expiresAt: c.expiresAt ?? null,
      active: c.active,
      createdAt: c.createdAt,
    })),
  });
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const code = normalizeCode(String(body.code ?? ""));
  if (!code) return NextResponse.json({ error: "Code is required" }, { status: 400 });

  const type = body.type === "flat" ? "flat" : "percent";
  const value = Math.max(0, Number(body.value ?? 0));
  if (!value) return NextResponse.json({ error: "Value must be greater than 0" }, { status: 400 });
  if (type === "percent" && value > 100) {
    return NextResponse.json({ error: "Percent cannot exceed 100" }, { status: 400 });
  }

  const plans = Array.isArray(body.plans)
    ? body.plans.filter((p) => p === "go" || p === "plus")
    : [];

  await connectDB();
  const exists = await Coupon.findOne({ code }).lean();
  if (exists) return NextResponse.json({ error: "That code already exists" }, { status: 409 });

  const coupon = await Coupon.create({
    code,
    description: String(body.description ?? "").slice(0, 200),
    type,
    value,
    minAmount: Math.max(0, Number(body.minAmount ?? 0)),
    maxRedemptions: body.maxRedemptions == null ? -1 : Number(body.maxRedemptions),
    oncePerUser: body.oncePerUser !== false,
    plans,
    expiresAt: body.expiresAt ? new Date(String(body.expiresAt)) : null,
    active: body.active !== false,
  });

  return NextResponse.json({ ok: true, id: coupon._id.toString() }, { status: 201 });
}
