import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/api-auth";
import { JobApplication } from "@/models";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  await connectDB();
  const role = req.nextUrl.searchParams.get("role");
  const status = req.nextUrl.searchParams.get("status");
  const query: Record<string, unknown> = {};
  if (role && role !== "all") query.role = role;
  if (status && status !== "all") query.status = status;

  const items = await JobApplication.find(query).sort({ createdAt: -1 }).limit(500).lean();
  const counts = await JobApplication.aggregate<{ _id: string; n: number }>([
    { $group: { _id: "$status", n: { $sum: 1 } } },
  ]);
  const byStatus = Object.fromEntries(counts.map((c) => [c._id, c.n]));

  return NextResponse.json({
    items: items.map((a) => ({
      id: a._id.toString(),
      role: a.role,
      roleTitle: a.roleTitle,
      name: a.name,
      email: a.email,
      phone: a.phone ?? "",
      link: a.link ?? "",
      message: a.message,
      status: a.status,
      createdAt: a.createdAt,
    })),
    counts: {
      total: items.length,
      new: byStatus.new ?? 0,
      reviewing: byStatus.reviewing ?? 0,
      shortlisted: byStatus.shortlisted ?? 0,
      rejected: byStatus.rejected ?? 0,
    },
  });
}
