import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/api-auth";
import { User } from "@/models";

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  await connectDB();
  const q = req.nextUrl.searchParams.get("q")?.trim();
  const query: Record<string, unknown> = {};
  if (q) {
    const regex = {
      $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      $options: "i",
    };
    query.$or = [{ name: regex }, { email: regex }, { username: regex }];
  }

  const users = await User.find(query)
    .sort({ createdAt: -1 })
    .limit(100)
    .select("name username email image role banned stats createdAt providers")
    .lean();

  return NextResponse.json({
    users: users.map((user) => ({
      id: user._id.toString(),
      name: user.name,
      username: user.username,
      email: user.email,
      image: user.image ?? null,
      role: user.role,
      banned: user.banned,
      xp: user.stats.xp,
      solved: user.stats.solved.total,
      providers: user.providers,
      createdAt: user.createdAt,
    })),
  });
}
