import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/api-auth";
import { QaContributor } from "@/models";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  await connectDB();
  const status = req.nextUrl.searchParams.get("status");
  const query: Record<string, unknown> = {};
  if (status && status !== "all") query.status = status;

  const items = await QaContributor.find(query).sort({ createdAt: -1 }).limit(500).lean();
  const counts = await QaContributor.aggregate<{ _id: string; n: number }>([
    { $group: { _id: "$status", n: { $sum: 1 } } },
  ]);
  const byStatus = Object.fromEntries(counts.map((c) => [c._id, c.n]));

  return NextResponse.json({
    items: items.map((c) => ({
      id: c._id.toString(),
      name: c.name,
      email: c.email,
      motivation: c.motivation,
      focusAreas: c.focusAreas ?? [],
      experience: c.experience ?? "",
      github: c.github ?? "",
      status: c.status,
      createdAt: c.createdAt,
    })),
    counts: {
      pending: byStatus.pending ?? 0,
      approved: byStatus.approved ?? 0,
      rejected: byStatus.rejected ?? 0,
    },
  });
}
