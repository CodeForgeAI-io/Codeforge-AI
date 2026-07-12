import { Types } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { cached, cache } from "@/lib/redis";
import { Contest, Question, User } from "@/models";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { backendFor } from "@/lib/data-backend";

const be = () => backendFor("contests");

/** Embedded participant shape stored in the contests.participants jsonb. */
interface SbParticipant {
  user: string;
  joinedAt: string;
  score: number;
  penaltySeconds: number;
  solvedQuestionIds: string[];
  finished: boolean;
}
/** Embedded question entry stored in the contests.questions jsonb. */
interface SbContestQuestion {
  question: string;
  points: number;
}
interface SbContestRow {
  slug: string;
  title: string;
  description: string;
  type: string;
  starts_at: string;
  duration_minutes: number;
  participants: SbParticipant[] | null;
  questions: SbContestQuestion[] | null;
}

export type ContestStatus = "upcoming" | "live" | "ended";

export function contestStatus(
  startsAt: Date,
  durationMinutes: number,
  now = Date.now(),
): ContestStatus {
  const start = startsAt.getTime();
  const end = start + durationMinutes * 60_000;
  if (now < start) return "upcoming";
  if (now <= end) return "live";
  return "ended";
}

export interface ContestListItem {
  slug: string;
  title: string;
  type: string;
  startsAt: string;
  durationMinutes: number;
  status: ContestStatus;
  participantCount: number;
  questionCount: number;
  joined: boolean;
}

export async function listContests(
  userId?: string,
): Promise<ContestListItem[]> {
  if (be() === "supabase") {
    const { data, error } = await supabaseAdmin()
      .from("contests")
      .select("slug,title,type,starts_at,duration_minutes,participants,questions")
      .eq("is_published", true)
      .order("starts_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return ((data ?? []) as SbContestRow[]).map((contest) => {
      const participants = contest.participants ?? [];
      const startsAt = new Date(contest.starts_at);
      return {
        slug: contest.slug,
        title: contest.title,
        type: contest.type,
        startsAt: startsAt.toISOString(),
        durationMinutes: contest.duration_minutes,
        status: contestStatus(startsAt, contest.duration_minutes),
        participantCount: participants.length,
        questionCount: (contest.questions ?? []).length,
        joined: userId ? participants.some((p) => p.user === userId) : false,
      };
    });
  }
  await connectDB();
  const contests = await Contest.find({ isPublished: true })
    .sort({ startsAt: -1 })
    .limit(50)
    .select("slug title type startsAt durationMinutes participants questions")
    .lean();

  return contests.map((contest) => ({
    slug: contest.slug,
    title: contest.title,
    type: contest.type,
    startsAt: contest.startsAt.toISOString(),
    durationMinutes: contest.durationMinutes,
    status: contestStatus(contest.startsAt, contest.durationMinutes),
    participantCount: contest.participants.length,
    questionCount: contest.questions.length,
    joined: userId
      ? contest.participants.some((p) => p.user.toString() === userId)
      : false,
  }));
}

export interface ContestDetail {
  slug: string;
  title: string;
  description: string;
  type: string;
  startsAt: string;
  endsAt: string;
  durationMinutes: number;
  status: ContestStatus;
  participantCount: number;
  joined: boolean;
  /** Question list only revealed to joined users during/after the contest */
  questions:
    | { slug: string; title: string; difficulty: string; points: number; solved: boolean }[]
    | null;
}

export async function getContestDetail(
  slug: string,
  userId?: string,
): Promise<ContestDetail | null> {
  if (be() === "supabase") return getContestDetailSupabase(slug, userId);
  await connectDB();
  const contest = await Contest.findOne({ slug, isPublished: true })
    .populate<{
      questions: { question: { _id: Types.ObjectId; slug: string; title: string; difficulty: string } | null; points: number }[];
    }>("questions.question", "slug title difficulty")
    .lean();
  if (!contest) return null;

  const status = contestStatus(contest.startsAt, contest.durationMinutes);
  const participant = userId
    ? contest.participants.find((p) => p.user.toString() === userId)
    : undefined;
  const joined = !!participant;

  const revealQuestions = status !== "upcoming" && (joined || status === "ended");

  return {
    slug: contest.slug,
    title: contest.title,
    description: contest.description,
    type: contest.type,
    startsAt: contest.startsAt.toISOString(),
    endsAt: new Date(
      contest.startsAt.getTime() + contest.durationMinutes * 60_000,
    ).toISOString(),
    durationMinutes: contest.durationMinutes,
    status,
    participantCount: contest.participants.length,
    joined,
    questions: revealQuestions
      ? contest.questions
          .filter((entry) => entry.question)
          .map((entry) => ({
            slug: entry.question!.slug,
            title: entry.question!.title,
            difficulty: entry.question!.difficulty,
            points: entry.points,
            solved:
              participant?.solvedQuestionIds.includes(
                entry.question!._id.toString(),
              ) ?? false,
          }))
      : null,
  };
}

async function getContestDetailSupabase(
  slug: string,
  userId?: string,
): Promise<ContestDetail | null> {
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("contests")
    .select("slug,title,description,type,starts_at,duration_minutes,participants,questions")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const contest = data as SbContestRow;

  const startsAt = new Date(contest.starts_at);
  const status = contestStatus(startsAt, contest.duration_minutes);
  const participants = contest.participants ?? [];
  const participant = userId
    ? participants.find((p) => p.user === userId)
    : undefined;
  const joined = !!participant;
  const revealQuestions =
    status !== "upcoming" && (joined || status === "ended");

  let questions: ContestDetail["questions"] = null;
  if (revealQuestions) {
    const entries = contest.questions ?? [];
    const ids = entries.map((e) => e.question).filter(Boolean);
    const { data: qs } = ids.length
      ? await sb
          .from("questions")
          .select("id,slug,title,difficulty")
          .in("id", ids)
      : { data: [] };
    const qMap = new Map(
      ((qs ?? []) as { id: string; slug: string; title: string; difficulty: string }[]).map(
        (q) => [q.id, q],
      ),
    );
    questions = entries
      .map((entry) => {
        const q = qMap.get(entry.question);
        if (!q) return null;
        return {
          slug: q.slug,
          title: q.title,
          difficulty: q.difficulty,
          points: entry.points,
          solved: participant?.solvedQuestionIds.includes(q.id) ?? false,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }

  return {
    slug: contest.slug,
    title: contest.title,
    description: contest.description,
    type: contest.type,
    startsAt: startsAt.toISOString(),
    endsAt: new Date(
      startsAt.getTime() + contest.duration_minutes * 60_000,
    ).toISOString(),
    durationMinutes: contest.duration_minutes,
    status,
    participantCount: participants.length,
    joined,
    questions,
  };
}

export async function joinContest(
  slug: string,
  userId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (be() === "supabase") {
    const sb = supabaseAdmin();
    const { data } = await sb
      .from("contests")
      .select("id,starts_at,duration_minutes,participants")
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();
    if (!data) return { ok: false, error: "Contest not found" };
    const row = data as {
      id: string;
      starts_at: string;
      duration_minutes: number;
      participants: SbParticipant[] | null;
    };
    const startsAt = new Date(row.starts_at);
    if (contestStatus(startsAt, row.duration_minutes) === "ended") {
      return { ok: false, error: "This contest has already ended" };
    }
    const participants = row.participants ?? [];
    if (participants.some((p) => p.user === userId)) return { ok: true };
    participants.push({
      user: userId,
      joinedAt: new Date().toISOString(),
      score: 0,
      penaltySeconds: 0,
      solvedQuestionIds: [],
      finished: false,
    });
    const { error } = await sb
      .from("contests")
      .update({ participants })
      .eq("id", row.id);
    if (error) throw new Error(error.message);
    await cache.del(`contest:lb:${slug}`);
    return { ok: true };
  }

  await connectDB();
  const contest = await Contest.findOne({ slug, isPublished: true });
  if (!contest) return { ok: false, error: "Contest not found" };

  const status = contestStatus(contest.startsAt, contest.durationMinutes);
  if (status === "ended") {
    return { ok: false, error: "This contest has already ended" };
  }
  if (contest.participants.some((p) => p.user.toString() === userId)) {
    return { ok: true };
  }

  contest.participants.push({
    user: new Types.ObjectId(userId),
    joinedAt: new Date(),
    score: 0,
    penaltySeconds: 0,
    solvedQuestionIds: [],
    finished: false,
  });
  await contest.save();
  await cache.del(`contest:lb:${slug}`);
  return { ok: true };
}

export interface ContestLeaderboardEntry {
  rank: number;
  name: string;
  username: string;
  image: string | null;
  score: number;
  penaltySeconds: number;
  solvedCount: number;
}

export async function getContestLeaderboard(
  slug: string,
): Promise<ContestLeaderboardEntry[] | null> {
  return cached(`contest:lb:${slug}`, 30, async () => {
    if (be() === "supabase") {
      const sb = supabaseAdmin();
      const { data } = await sb
        .from("contests")
        .select("participants")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();
      if (!data) return null;
      const participants =
        (data as { participants: SbParticipant[] | null }).participants ?? [];
      const userIds = participants.map((p) => p.user);
      const { data: users } = userIds.length
        ? await sb.from("users").select("id,name,username,image").in("id", userIds)
        : { data: [] };
      const userMap = new Map(
        ((users ?? []) as { id: string; name: string; username: string; image: string | null }[]).map(
          (u) => [u.id, u],
        ),
      );
      return participants
        .map((participant) => {
          const user = userMap.get(participant.user);
          return {
            name: user?.name ?? "Unknown",
            username: user?.username ?? "",
            image: user?.image ?? null,
            score: participant.score,
            penaltySeconds: participant.penaltySeconds,
            solvedCount: participant.solvedQuestionIds.length,
          };
        })
        .sort((a, b) => b.score - a.score || a.penaltySeconds - b.penaltySeconds)
        .map((entry, index) => ({ ...entry, rank: index + 1 }));
    }

    await connectDB();
    const contest = await Contest.findOne({ slug, isPublished: true })
      .select("participants")
      .lean();
    if (!contest) return null;

    const userIds = contest.participants.map((p) => p.user);
    const users = await User.find({ _id: { $in: userIds } })
      .select("name username image")
      .lean();
    const userMap = new Map(users.map((user) => [user._id.toString(), user]));

    return contest.participants
      .map((participant) => {
        const user = userMap.get(participant.user.toString());
        return {
          name: user?.name ?? "Unknown",
          username: user?.username ?? "",
          image: user?.image ?? null,
          score: participant.score,
          penaltySeconds: participant.penaltySeconds,
          solvedCount: participant.solvedQuestionIds.length,
        };
      })
      .sort(
        (a, b) => b.score - a.score || a.penaltySeconds - b.penaltySeconds,
      )
      .map((entry, index) => ({ ...entry, rank: index + 1 }));
  });
}

/** Deterministic daily challenge: rotates through published questions by date */
export async function getDailyChallenge(): Promise<{
  id: string;
  slug: string;
  title: string;
  difficulty: string;
} | null> {
  return cached("daily-challenge", 600, async () => {
    const dayNumber = Math.floor(Date.now() / 86_400_000);
    if (be() === "supabase") {
      const sb = supabaseAdmin();
      const { count } = await sb
        .from("questions")
        .select("id", { count: "exact", head: true })
        .eq("is_published", true);
      if (!count) return null;
      const offset = dayNumber % count;
      const { data } = await sb
        .from("questions")
        .select("id,slug,title,difficulty")
        .eq("is_published", true)
        .order("created_at", { ascending: true })
        .range(offset, offset);
      const q = (data ?? [])[0] as
        | { id: string; slug: string; title: string; difficulty: string }
        | undefined;
      if (!q) return null;
      return { id: q.id, slug: q.slug, title: q.title, difficulty: q.difficulty };
    }

    await connectDB();
    const count = await Question.countDocuments({ isPublished: true });
    if (count === 0) return null;
    const question = await Question.findOne({ isPublished: true })
      .sort({ createdAt: 1 })
      .skip(dayNumber % count)
      .select("slug title difficulty")
      .lean();
    if (!question) return null;
    return {
      id: question._id.toString(),
      slug: question.slug,
      title: question.title,
      difficulty: question.difficulty,
    };
  });
}
