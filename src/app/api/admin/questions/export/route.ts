import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/api-auth";
import { mapToObject } from "@/lib/utils";
import { Question } from "@/models";

export const dynamic = "force-dynamic";

/**
 * Admin: download every question as a JSON file in the same format the
 * importer accepts — a full backup that can be re-uploaded anywhere.
 */
export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  await connectDB();
  const questions = await Question.find().sort({ createdAt: 1 }).lean();

  const payload = questions.map((question) => ({
    title: question.title,
    difficulty: question.difficulty,
    category: question.category,
    tags: question.tags,
    companies: question.companies,
    description: question.description,
    examples: question.examples.map((example) => ({
      input: example.input,
      output: example.output,
      ...(example.explanation ? { explanation: example.explanation } : {}),
    })),
    constraints: question.constraints,
    starterCode: mapToObject(question.starterCode),
    testCases: question.testCases.map((testCase) => ({
      input: testCase.input,
      expected: testCase.expected,
      hidden: testCase.hidden,
    })),
    ...(question.solution ? { solution: question.solution } : {}),
    ...(question.editorial ? { editorial: question.editorial } : {}),
    hints: question.hints,
    isPublished: question.isPublished,
  }));

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="codeforge-questions-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
