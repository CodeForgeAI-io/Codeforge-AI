import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { complete } from "@/services/ai/groq";
import { connectDB } from "@/lib/mongodb";
import { Submission } from "@/models";

export async function POST(req: NextRequest) {
  const { session, error } = await requireUser();
  if (error) return error;

  const { goal, weeks = 4, hoursPerDay = 2 } = await req.json();

  await connectDB();
  const recentSubs = await Submission.find({ user: session.user.id, kind: "dsa" })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate("question", "category difficulty")
    .lean();

  const solvedCategories = [...new Set(
    recentSubs.filter((s) => s.status === "accepted")
      .map((s) => (s.question as { category?: string } | null)?.category)
      .filter(Boolean)
  )];

  const result = await complete([
    {
      role: "system",
      content: "You are an expert coding interview coach. Create a structured study plan as JSON only.",
    },
    {
      role: "user",
      content: `Create a ${weeks}-week coding study plan for: "${goal || "software engineering interview"}"
Hours per day: ${hoursPerDay}
Already knows: ${solvedCategories.join(", ") || "beginner"}

Return JSON:
{
  "title": "string",
  "totalWeeks": number,
  "hoursPerDay": number,
  "weeks": [
    {
      "week": number,
      "theme": "string",
      "topics": ["string"],
      "dailyTasks": [
        { "day": "string", "task": "string", "type": "theory|practice|review", "mins": number }
      ],
      "goal": "string"
    }
  ],
  "tips": ["string"],
  "milestones": [{ "week": number, "milestone": "string" }]
}`,
    },
  ], { json: true, maxTokens: 2500 });

  try {
    return NextResponse.json({ plan: JSON.parse(result) });
  } catch {
    return NextResponse.json({ error: "Failed to generate plan" }, { status: 500 });
  }
}
