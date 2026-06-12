import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireUser } from "@/lib/api-auth";
import { Question } from "@/models";
import { DIFFICULTIES, type Difficulty } from "@/lib/constants";

/** Random question set for a mock interview session */
export async function GET(req: NextRequest) {
  const { error } = await requireUser();
  if (error) return error;

  const params = req.nextUrl.searchParams;
  const category = params.get("category");
  const difficulty = params.get("difficulty");
  const count = Math.min(Math.max(Number(params.get("count")) || 2, 1), 5);

  await connectDB();
  const match: Record<string, unknown> = { isPublished: true };
  if (category && category !== "any") match.category = category;
  if (difficulty && DIFFICULTIES.includes(difficulty as Difficulty)) {
    match.difficulty = difficulty;
  }

  const docs = await Question.aggregate<{
    _id: { toString(): string };
    slug: string;
    title: string;
    difficulty: string;
    category: string;
    description: string;
    examples: { input: string; output: string; explanation?: string }[];
    constraints: string[];
    starterCode: Record<string, string>;
    testCases: { input: string; expected: string; hidden: boolean }[];
  }>([{ $match: match }, { $sample: { size: count } }]);

  if (docs.length === 0) {
    return NextResponse.json(
      {
        error:
          "No published questions match those settings. Ask an admin to add questions first.",
      },
      { status: 404 },
    );
  }

  return NextResponse.json({
    questions: docs.map((doc) => ({
      id: doc._id.toString(),
      slug: doc.slug,
      title: doc.title,
      difficulty: doc.difficulty,
      category: doc.category,
      description: doc.description,
      examples: doc.examples.map((example) => ({
        input: example.input,
        output: example.output,
        explanation: example.explanation,
      })),
      constraints: doc.constraints,
      starterCode: doc.starterCode ?? {},
      sampleTests: doc.testCases
        .filter((testCase) => !testCase.hidden)
        .map((testCase) => ({
          input: testCase.input,
          expected: testCase.expected,
        })),
    })),
  });
}
