import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import {
  questionImportSchema,
  normalizeQuestionImport,
} from "@/schemas/question";
import { saveQuestionDraft } from "@/services/ai/generate-questions";
import { adminListQuestions } from "@/services/questions";

/** Admin: list ALL questions including unpublished drafts */
export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const search = req.nextUrl.searchParams.get("q")?.trim() || undefined;
  const questions = await adminListQuestions(search);
  return NextResponse.json({ questions });
}

/**
 * Admin: create question(s). Accepts a single question object or an array
 * (the JSON file upload posts its parsed contents here).
 */
export async function POST(req: NextRequest) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = questionImportSchema.safeParse(normalizeQuestionImport(body));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json(
      {
        error: `Validation failed at ${issue?.path.join(".") || "(root)"}: ${issue?.message}`,
      },
      { status: 400 },
    );
  }

  const items = Array.isArray(parsed.data) ? parsed.data : [parsed.data];
  const created: { slug: string; title: string }[] = [];
  const failed: { title: string; reason: string }[] = [];

  for (const item of items) {
    try {
      created.push(
        await saveQuestionDraft(
          item,
          session.user.id,
          Array.isArray(parsed.data) ? "json-import" : "manual",
        ),
      );
    } catch (saveError) {
      failed.push({
        title: item.title,
        reason: saveError instanceof Error ? saveError.message : "Save failed",
      });
    }
  }

  return NextResponse.json({ created, failed }, { status: 201 });
}
