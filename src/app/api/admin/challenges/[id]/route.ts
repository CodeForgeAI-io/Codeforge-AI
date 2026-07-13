import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { challengeInputSchema } from "@/schemas/challenge";
import { getAdminChallenge, updateChallenge, deleteChallengeCascade } from "@/services/challenges";

const patchSchema = challengeInputSchema.partial();

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const challenge = await getAdminChallenge(id);
  if (!challenge) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ challenge });
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

  // Only update keys the client actually sent (zod .partial() fills defaults).
  const sentKeys = new Set(Object.keys(body as object));
  const update = Object.fromEntries(
    Object.entries(parsed.data).filter(([key]) => sentKeys.has(key)),
  );

  try {
    const slug = await updateChallenge(id, update);
    if (!slug) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, slug });
  } catch (saveError) {
    return NextResponse.json(
      { error: saveError instanceof Error ? saveError.message : "Failed to save" },
      { status: 500 },
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const ok = await deleteChallengeCascade(id);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
