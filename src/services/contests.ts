import { Types } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { cached, cache } from "@/lib/redis";
import { Contest, Question, User } from "@/models";

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

export async function joinContest(
  slug: string,
  userId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
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
  await connectDB();
  return cached(`contest:lb:${slug}`, 30, async () => {
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
  await connectDB();
  return cached("daily-challenge", 600, async () => {
    const count = await Question.countDocuments({ isPublished: true });
    if (count === 0) return null;
    const dayNumber = Math.floor(Date.now() / 86_400_000);
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
