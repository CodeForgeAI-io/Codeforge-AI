import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { enforceAiCredit } from "@/services/ai-credits";
import { complete } from "@/services/ai/groq";

export async function POST(req: NextRequest) {
  const { session, error } = await requireUser();
  if (error) return error;

  const credit = await enforceAiCredit(session.user.id, session.user.plan);
  if (credit) return credit;

  const { code, language, questionTitle } = await req.json();
  if (!code?.trim()) {
    return NextResponse.json({ error: "Code is required" }, { status: 400 });
  }

  const result = await complete(
    [
      {
        role: "system",
        content:
          "You are an expert code reviewer specializing in algorithms and data structures. Score the solution and return JSON only.",
      },
      {
        role: "user",
        content: `Review this ${language ?? "code"} solution${questionTitle ? ` for "${questionTitle}"` : ""}.\n\nCode:\n\`\`\`${language ?? ""}\n${code.slice(0, 3000)}\n\`\`\`\n\nReturn JSON:\n{\n  "correctness": number,\n  "readability": number,\n  "performance": number,\n  "bestPractices": number,\n  "overall": number,\n  "timeComplexity": "string",\n  "spaceComplexity": "string",\n  "feedback": "string",\n  "improvements": ["string"],\n  "positives": ["string"]\n}`,
      },
    ],
    { json: true, maxTokens: 1000 },
  );

  try {
    const review = JSON.parse(result);
    return NextResponse.json({ review });
  } catch {
    return NextResponse.json({ error: "Failed to review code" }, { status: 500 });
  }
}
