import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireUser } from "@/lib/api-auth";
import { Submission, Question } from "@/models";
import { groq } from "@/services/ai/groq";

export async function GET() {
  const { session, error } = await requireUser();
  if (error) return error;

  await connectDB();

  const recentSubs = await Submission.find({
    user: session.user.id,
    kind: "dsa",
    status: "accepted",
  })
    .sort({ createdAt: -1 })
    .limit(20)
    .populate("question", "category difficulty")
    .lean();

  const solvedIds = recentSubs.map((s) => s.question?._id).filter(Boolean);
  const categoryCounts: Record<string, number> = {};
  for (const s of recentSubs) {
    const q = s.question as { category?: string } | null;
    if (q?.category) categoryCounts[q.category] = (categoryCounts[q.category] ?? 0) + 1;
  }

  const weakCategory = Object.entries(categoryCounts).sort((a, b) => a[1] - b[1])[0]?.[0];

  const [easy, medium, hard] = await Promise.all([
    Question.findOne({
      isPublished: true,
      difficulty: "Easy",
      _id: { $nin: solvedIds },
      ...(weakCategory ? { category: weakCategory } : {}),
    }).select("slug title difficulty category").lean(),
    Question.findOne({
      isPublished: true,
      difficulty: "Medium",
      _id: { $nin: solvedIds },
    }).select("slug title difficulty category").lean(),
    Question.findOne({
      isPublished: true,
      difficulty: "Hard",
      _id: { $nin: solvedIds },
    }).select("slug title difficulty category").lean(),
  ]);

  const tasks = [easy, medium, hard].filter(Boolean).map((q) => ({
    question: q,
    estimatedMins: q!.difficulty === "Easy" ? 15 : q!.difficulty === "Medium" ? 30 : 45,
  }));

  const totalMins = tasks.reduce((sum, t) => sum + t.estimatedMins, 0);

  return NextResponse.json({
    date: new Date().toISOString().slice(0, 10),
    tasks,
    totalMins,
    focus: weakCategory ?? "General Practice",
  });
}
