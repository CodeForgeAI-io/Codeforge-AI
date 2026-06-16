import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/api-auth";
import { mapToObject } from "@/lib/utils";
import { Question, Submission } from "@/models";
import { questionInputSchema } from "@/schemas/question";

const patchSchema = questionInputSchema.partial();

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** Admin: full question detail (for the edit dialog) */
export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  await connectDB();
  const question = await Question.findById(id).lean();
  if (!question) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    question: {
      id: question._id.toString(),
      title: question.title,
      difficulty: question.difficulty,
      category: question.category,
      tags: question.tags,
      companies: question.companies,
      description: question.description,
      examples: question.examples.map((example) => ({
        input: example.input,
        output: example.output,
        explanation: example.explanation,
      })),
      constraints: question.constraints,
      starterCode: mapToObject(question.starterCode),
      testCases: question.testCases.map((testCase) => ({
        input: testCase.input,
        expected: testCase.expected,
        hidden: testCase.hidden,
      })),
      solution: question.solution,
      editorial: question.editorial,
      hints: question.hints,
      isPublished: question.isPublished,
    },
  });
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json(
      {
        error: `Validation failed at ${issue?.path.join(".") || "(root)"}: ${issue?.message}`,
      },
      { status: 400 },
    );
  }

  await connectDB();
  // zod's .partial() still fills .default() values for absent fields —
  // only update keys the client actually sent or we'd wipe data
  const sentKeys = new Set(Object.keys(body as object));
  const update = Object.fromEntries(
    Object.entries(parsed.data).filter(([key]) => sentKeys.has(key)),
  );

  const updated = await Question.findByIdAndUpdate(
    id,
    { $set: update },
    { returnDocument: 'after' },
  );
  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, slug: updated.slug });
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  await connectDB();
  const deleted = await Question.findByIdAndDelete(id);
  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await Submission.deleteMany({ question: deleted._id });
  return NextResponse.json({ ok: true });
}

export const dynamic = "force-dynamic";
export type AdminQuestionPatch = z.infer<typeof patchSchema>;
