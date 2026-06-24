import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { enforceAiCredit } from "@/services/ai-credits";
import { complete } from "@/services/ai/groq";

export async function POST(req: NextRequest) {
  const { session, error } = await requireUser();
  if (error) return error;

  const credit = await enforceAiCredit(session.user.id, session.user.plan);
  if (credit) return credit;

  const { resumeText, targetRole } = await req.json();
  if (!resumeText?.trim()) {
    return NextResponse.json({ error: "Resume text is required" }, { status: 400 });
  }

  const result = await complete(
    [
      {
        role: "system",
        content:
          "You are an expert ATS resume reviewer and career coach for software engineering roles. Analyze the resume and return JSON only.",
      },
      {
        role: "user",
        content: `Analyze this resume for a ${targetRole ?? "software engineer"} role.\n\nResume:\n${resumeText.slice(0, 4000)}\n\nReturn JSON:\n{\n  "atsScore": number,\n  "overallScore": number,\n  "strengths": ["string"],\n  "weaknesses": ["string"],\n  "missingKeywords": ["string"],\n  "suggestedKeywords": ["string"],\n  "improvements": [\n    { "section": "string", "issue": "string", "suggestion": "string" }\n  ],\n  "summary": "string"\n}`,
      },
    ],
    { json: true, maxTokens: 1500 },
  );

  try {
    const analysis = JSON.parse(result);
    return NextResponse.json({ analysis });
  } catch {
    return NextResponse.json({ error: "Failed to analyze resume" }, { status: 500 });
  }
}
