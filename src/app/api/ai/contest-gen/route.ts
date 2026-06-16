import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { complete } from "@/services/ai/groq";

export async function POST(req: NextRequest) {
  const { error } = await requireUser();
  if (error) return error;

  const { theme, difficulty = "Mixed", numQuestions = 4, duration = 90 } = await req.json();

  const result = await complete([
    {
      role: "system",
      content: "You are an expert competitive programming contest designer. Create engaging, solvable contests. Return JSON only.",
    },
    {
      role: "user",
      content: `Design a coding contest with these specs:
Theme: ${theme || "General Algorithms"}
Difficulty: ${difficulty}
Number of questions: ${numQuestions}
Duration: ${duration} minutes

Return JSON:
{
  "title": "string",
  "description": "string",
  "duration": number,
  "problems": [
    {
      "order": number,
      "title": "string",
      "difficulty": "Easy|Medium|Hard",
      "category": "string",
      "description": "string",
      "examples": [{ "input": "string", "output": "string", "explanation": "string" }],
      "constraints": ["string"],
      "hint": "string",
      "points": number
    }
  ],
  "totalPoints": number,
  "tags": ["string"]
}`,
    },
  ], { json: true, maxTokens: 3000 });

  try {
    return NextResponse.json({ contest: JSON.parse(result) });
  } catch {
    return NextResponse.json({ error: "Failed to generate contest" }, { status: 500 });
  }
}
