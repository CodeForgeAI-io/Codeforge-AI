import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireUser } from "@/lib/api-auth";
import { Follow, Submission } from "@/models";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { backendFor } from "@/lib/data-backend";

const be = () => backendFor("follow");

interface SbUserMini {
  id: string;
  username: string;
  name: string;
  image: string | null;
  stats: { xp?: number; level?: number } | null;
}

/** Fetch users by id and shape like a populated Mongo user subdoc. */
async function fetchUsers(ids: string[]) {
  if (!ids.length) return [];
  const { data } = await supabaseAdmin()
    .from("users")
    .select("id,username,name,image,stats")
    .in("id", ids);
  return ((data ?? []) as SbUserMini[]).map((u) => ({
    _id: u.id,
    username: u.username,
    name: u.name,
    image: u.image,
    stats: { xp: u.stats?.xp ?? 0, level: u.stats?.level ?? 1 },
  }));
}

export async function GET(req: NextRequest) {
  const { session, error } = await requireUser();
  if (error) return error;

  const type = req.nextUrl.searchParams.get("type") ?? "feed";

  if (be() === "supabase") {
    const sb = supabaseAdmin();
    if (type === "followers") {
      const { data } = await sb.from("follows").select("follower_id").eq("following_id", session.user.id);
      const users = await fetchUsers((data ?? []).map((f) => f.follower_id as string));
      return NextResponse.json({ users });
    }
    if (type === "following") {
      const { data } = await sb.from("follows").select("following_id").eq("follower_id", session.user.id);
      const users = await fetchUsers((data ?? []).map((f) => f.following_id as string));
      return NextResponse.json({ users });
    }

    // Activity feed from followed users
    const { data: follows } = await sb.from("follows").select("following_id").eq("follower_id", session.user.id);
    const followingIds = (follows ?? []).map((f) => f.following_id as string);
    if (!followingIds.length) return NextResponse.json({ feed: [] });

    const { data: subs } = await sb
      .from("submissions")
      .select("id,status,created_at,user_id,question_id,challenge_id")
      .eq("status", "Accepted")
      .in("user_id", followingIds)
      .order("created_at", { ascending: false })
      .limit(30);
    const rows = (subs ?? []) as {
      id: string; status: string; created_at: string;
      user_id: string; question_id: string | null; challenge_id: string | null;
    }[];

    const [users, qs, cs] = await Promise.all([
      fetchUsers([...new Set(rows.map((r) => r.user_id))]),
      (() => {
        const ids = [...new Set(rows.map((r) => r.question_id).filter(Boolean))] as string[];
        return ids.length ? sb.from("questions").select("id,slug,title,difficulty").in("id", ids) : Promise.resolve({ data: [] });
      })(),
      (() => {
        const ids = [...new Set(rows.map((r) => r.challenge_id).filter(Boolean))] as string[];
        return ids.length ? sb.from("frontend_challenges").select("id,slug,title,difficulty").in("id", ids) : Promise.resolve({ data: [] });
      })(),
    ]);
    const uMap = new Map(users.map((u) => [u._id, { _id: u._id, username: u.username, name: u.name, image: u.image }]));
    const qMap = new Map(((qs.data ?? []) as { id: string; slug: string; title: string; difficulty: string }[]).map((q) => [q.id, { _id: q.id, slug: q.slug, title: q.title, difficulty: q.difficulty }]));
    const cMap = new Map(((cs.data ?? []) as { id: string; slug: string; title: string; difficulty: string }[]).map((c) => [c.id, { _id: c.id, slug: c.slug, title: c.title, difficulty: c.difficulty }]));

    const feed = rows.map((r) => ({
      _id: r.id,
      status: r.status,
      createdAt: r.created_at,
      user: uMap.get(r.user_id) ?? null,
      question: r.question_id ? qMap.get(r.question_id) ?? null : null,
      challenge: r.challenge_id ? cMap.get(r.challenge_id) ?? null : null,
    }));
    return NextResponse.json({ feed });
  }

  await connectDB();

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
    status: "Accepted",
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

  if (be() === "supabase") {
    const sb = supabaseAdmin();
    const { data: existing } = await sb
      .from("follows")
      .select("id")
      .eq("follower_id", session.user.id)
      .eq("following_id", userId)
      .maybeSingle();
    if (!existing) {
      await sb.from("follows").insert({ follower_id: session.user.id, following_id: userId });
    }
    return NextResponse.json({ following: true }, { status: existing ? 200 : 201 });
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
  if (be() === "supabase") {
    await supabaseAdmin()
      .from("follows")
      .delete()
      .eq("follower_id", session.user.id)
      .eq("following_id", userId);
    return NextResponse.json({ following: false });
  }
  await connectDB();
  await Follow.deleteOne({ follower: session.user.id, following: userId });
  return NextResponse.json({ following: false });
}
