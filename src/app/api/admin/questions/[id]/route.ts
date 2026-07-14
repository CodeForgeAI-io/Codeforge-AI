import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/api-auth";
import { questionInputSchema } from "@/schemas/question";
import { getAdminQuestion, updateQuestion, deleteQuestionCascade } from "@/services/questions";
import { pingIndexNow } from "@/lib/indexnow";

const patchSchema = questionInputSchema.partial();

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** Admin: full question detail (for the edit dialog) */
export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const question = await getAdminQuestion(id);
  if (!question) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ question });
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

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
      { error: `Validation failed at ${issue?.path.join(".") || "(root)"}: ${issue?.message}` },
      { status: 400 },
    );
  }

  // zod's .partial() still fills .default() values for absent fields —
  // only update keys the client actually sent or we'd wipe data.
  const sentKeys = new Set(Object.keys(body as object));
  const update = Object.fromEntries(
    Object.entries(parsed.data).filter(([key]) => sentKeys.has(key)),
  );

  const slug = await updateQuestion(id, update);
  if (!slug) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  // Nudge search engines the moment a problem goes public.
  if ((update as { isPublished?: boolean }).isPublished === true) {
    await pingIndexNow(`/problems/${slug}`);
  }
  return NextResponse.json({ ok: true, slug });
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const ok = await deleteQuestionCascade(id);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

export const dynamic = "force-dynamic";
export type AdminQuestionPatch = z.infer<typeof patchSchema>;
