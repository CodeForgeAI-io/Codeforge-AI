import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { complete } from "@/services/ai/groq";

export async function POST(req: NextRequest) {
  const { error } = await requireUser();
  if (error) return error;

  const { repoUrl, description, techStack } = await req.json();
  if (!repoUrl?.trim()) {
    return NextResponse.json({ error: "Repository URL is required" }, { status: 400 });
  }

  const result = await complete(
    [
      {
        role: "system",
        content:
          "You are a senior software architect reviewing GitHub projects. Provide actionable feedback as JSON only.",
      },
      {
        role: "user",
        content: `Review this GitHub project:\n\nURL: ${repoUrl}\nDescription: ${description ?? "Not provided"}\nTech Stack: ${techStack ?? "Not specified"}\n\nReturn JSON:\n{\n  "codeQualityScore": number,\n  "architectureScore": number,\n  "documentationScore": number,\n  "overallScore": number,\n  "strengths": ["string"],\n  "issues": [\n    { "severity": "high|medium|low", "area": "string", "issue": "string", "suggestion": "string" }\n  ],\n  "recommendations": ["string"],\n  "securityConcerns": ["string"],\n  "summary": "string"\n}`,
      },
    ],
    { json: true, maxTokens: 1500 },
  );

  try {
    const review = JSON.parse(result);
    return NextResponse.json({ review });
  } catch {
    return NextResponse.json({ error: "Failed to review project" }, { status: 500 });
  }
}
