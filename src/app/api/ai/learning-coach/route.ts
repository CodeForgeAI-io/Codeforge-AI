import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { enforceAiCredit } from "@/services/ai-credits";
import { complete } from "@/services/ai/groq";
import { connectDB } from "@/lib/mongodb";
import { Submission, User } from "@/models";

export async function GET() {
  const { session, error } = await requireUser();
  if (error) return error;

  const credit = await enforceAiCredit(session.user.id, session.user.plan);
  if (credit) return credit;

  await connectDB();
  const [user, recentSubs] = await Promise.all([
    User.findById(session.user.id).lean(),
    Submission.find({ user: session.user.id, kind: "dsa" })
      .sort({ createdAt: -1 })
      .limit(30)
      .populate("question", "category difficulty")
      .lean(),
  ]);

  const stats = user?.stats;
  const categoryMap: Record<string, { attempted: number; accepted: number }> = {};
  for (const sub of recentSubs) {
    const q = sub.question as { category?: string } | null;
    if (!q?.category) continue;
    if (!categoryMap[q.category]) categoryMap[q.category] = { attempted: 0, accepted: 0 };
    categoryMap[q.category].attempted++;
    if (sub.status === "Accepted") categoryMap[q.category].accepted++;
  }

  const weakCategories = Object.entries(categoryMap)
    .filter(([, v]) => v.attempted >= 2 && v.accepted / v.attempted < 0.5)
    .map(([cat]) => cat);

  const result = await complete([
    {
      role: "system",
      content: "You are a personalized AI learning coach for coding interviews. Analyze the user's data and provide actionable guidance. Return JSON only.",
    },
    {
      role: "user",
      content: `Analyze this coder's profile and give personalized coaching:
Level: ${stats?.level ?? 1}
XP: ${stats?.xp ?? 0}
Problems solved: ${stats?.solved?.total ?? 0} (Easy: ${stats?.solved?.easy ?? 0}, Medium: ${stats?.solved?.medium ?? 0}, Hard: ${stats?.solved?.hard ?? 0})
Current streak: ${stats?.streak?.current ?? 0} days
Weak categories: ${weakCategories.join(", ") || "unknown yet"}
Recent activity: ${recentSubs.length} submissions in last 30 days

Return JSON:
{
  "level": "beginner|intermediate|advanced",
  "readinessScore": number,
  "strengths": ["string"],
  "focusAreas": ["string"],
  "weeklyGoal": "string",
  "motivationalMessage": "string",
  "nextSteps": [{ "action": "string", "why": "string", "priority": "high|medium|low" }],
  "estimatedReadyDate": "string"
}`,
    },
  ], { json: true, maxTokens: 1000 });

  try {
    return NextResponse.json({ coaching: JSON.parse(result) });
  } catch {
    return NextResponse.json({ error: "Failed to generate coaching" }, { status: 500 });
  }
}
