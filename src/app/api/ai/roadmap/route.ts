import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { complete } from "@/services/ai/groq";

export async function POST(req: NextRequest) {
  const { error } = await requireUser();
  if (error) return error;

  const { goal } = await req.json();
  if (!goal?.trim()) {
    return NextResponse.json({ error: "Goal is required" }, { status: 400 });
  }

  const result = await complete(
    [
      {
        role: "system",
        content:
          "You are an expert software engineering career coach. Generate a structured learning roadmap as JSON. Return ONLY valid JSON.",
      },
      {
        role: "user",
        content: `Generate a coding learning roadmap for: "${goal}"\n\nReturn JSON in this exact format:\n{\n  "title": "string",\n  "description": "string",\n  "estimatedWeeks": number,\n  "phases": [\n    {\n      "phase": number,\n      "title": "string",\n      "weeks": "string",\n      "topics": ["string"],\n      "resources": ["string"],\n      "milestone": "string"\n    }\n  ],\n  "dsaTopics": ["string"],\n  "systemDesignTopics": ["string"],\n  "tips": ["string"]\n}`,
      },
    ],
    { json: true, maxTokens: 2000 },
  );

  try {
    const roadmap = JSON.parse(result);
    return NextResponse.json({ roadmap });
  } catch {
    return NextResponse.json({ error: "Failed to parse roadmap" }, { status: 500 });
  }
}
