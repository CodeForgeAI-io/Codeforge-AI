import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireUser } from "@/lib/api-auth";
import { Follow, User, Submission } from "@/models";

export async function GET(req: NextRequest) {
  const { session, error } = await requireUser();
  if (error) return error;

  await connectDB();
  const type = req.nextUrl.searchParams.get("type") ?? "feed";

  if (type === "followers") {
    const follows = await Follow.find({ following: session.user.id })
      .populate("follower", "username name image stats.xp stats.level")
      .lean();
    return NextResponse.json({ users: follows.map((f) => f.follower) });
  }

  if (type === "following") {
    const follows = await Follow.find({ follower: session.user.id })
      .populate("following", "username name image stats.xp stats.level")
      .lean();
    return NextResponse.json({ users: follows.map((f) => f.following) });
  }

  // Activity feed from followed users
  const follows = await Follow.find({ follower: session.user.id }).select("following").lean();
  const followingIds = follows.map((f) => f.following);

  const feed = await Submission.find({
    user: { $in: followingIds },
    status: "accepted",
  })
    .sort({ createdAt: -1 })
    .limit(30)
    .populate("user", "username name image")
    .populate("question", "slug title difficulty")
    .populate("challenge", "slug title difficulty")
    .lean();

  return NextResponse.json({ feed });
}

export async function POST(req: NextRequest) {
  const { session, error } = await requireUser();
  if (error) return error;

  const { userId } = await req.json();
  if (!userId || userId === session.user.id) {
    return NextResponse.json({ error: "Invalid user" }, { status: 400 });
  }

  await connectDB();
  const existing = await Follow.findOne({ follower: session.user.id, following: userId });
  if (existing) {
    return NextResponse.json({ following: true });
  }

  await Follow.create({ follower: session.user.id, following: userId });
  return NextResponse.json({ following: true }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { session, error } = await requireUser();
  if (error) return error;

  const { userId } = await req.json();
  await connectDB();
  await Follow.deleteOne({ follower: session.user.id, following: userId });
  return NextResponse.json({ following: false });
}
