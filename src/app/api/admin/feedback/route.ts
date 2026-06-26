import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/api-auth";
import { Feedback } from "@/models";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  await connectDB();
  const status = req.nextUrl.searchParams.get("status");
  const type = req.nextUrl.searchParams.get("type");
  const query: Record<string, unknown> = {};
  if (status && status !== "all") query.status = status;
  if (type && type !== "all") query.type = type;

  const items = await Feedback.find(query)
    .populate("user", "name username")
    .sort({ createdAt: -1 })
    .limit(500)
    .lean();

  const counts = await Feedback.aggregate<{ _id: string; n: number }>([
    { $group: { _id: "$status", n: { $sum: 1 } } },
  ]);
  const byStatus = Object.fromEntries(counts.map((c) => [c._id, c.n]));

  return NextResponse.json({
    items: items.map((f) => ({
      id: f._id.toString(),
      type: f.type,
      title: f.title,
      description: f.description,
      email: f.email ?? "",
      user: f.user ? { name: (f.user as { name?: string }).name ?? "", username: (f.user as { username?: string }).username ?? "" } : null,
      status: f.status,
      createdAt: f.createdAt,
    })),
    counts: {
      new: byStatus.new ?? 0,
      read: byStatus.read ?? 0,
      resolved: byStatus.resolved ?? 0,
    },
  });
}
