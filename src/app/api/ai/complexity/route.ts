import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { enforceAiCredit } from "@/services/ai-credits";
import { complete } from "@/services/ai/groq";

export async function POST(req: NextRequest) {
  const { session, error } = await requireUser();
  if (error) return error;

  const credit = await enforceAiCredit(session.user.id, session.user.plan);
  if (credit) return credit;

  const { code, language } = await req.json();
  if (!code?.trim()) {
    return NextResponse.json({ error: "Code required" }, { status: 400 });
  }

  const result = await complete([
    {
      role: "system",
      content: "You are an expert algorithm complexity analyzer. Analyze code and return detailed complexity breakdown as JSON only.",
    },
    {
      role: "user",
      content: `Analyze the time and space complexity of this ${language ?? "code"}:

\`\`\`${language ?? ""}
${code.slice(0, 3000)}
\`\`\`

Return JSON:
{
  "timeComplexity": "string",
  "spaceComplexity": "string",
  "timeBreakdown": [{ "line": "string", "complexity": "string", "explanation": "string" }],
  "loops": [{ "description": "string", "complexity": "string" }],
  "bestCase": "string",
  "worstCase": "string",
  "averageCase": "string",
  "canBeOptimized": boolean,
  "optimizationHint": "string",
  "comparison": { "vs_brute_force": "string", "optimal": "string" },
  "explanation": "string"
}`,
    },
  ], { json: true, maxTokens: 1200 });

  try {
    return NextResponse.json({ analysis: JSON.parse(result) });
  } catch {
    return NextResponse.json({ error: "Failed to analyze complexity" }, { status: 500 });
  }
}
