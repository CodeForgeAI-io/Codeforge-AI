import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/api-auth";
import { mapToObject } from "@/lib/utils";
import { FrontendChallenge, Submission } from "@/models";
import { challengeInputSchema } from "@/schemas/challenge";

const patchSchema = challengeInputSchema.partial();

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  await connectDB();
  const challenge = await FrontendChallenge.findById(id).lean();
  if (!challenge) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    challenge: {
      id: challenge._id.toString(),
      title: challenge.title,
      difficulty: challenge.difficulty,
      tech: challenge.tech,
      tags: challenge.tags,
      brief: challenge.brief,
      description: challenge.description,
      designSpec: challenge.designSpec,
      starterFiles: mapToObject(challenge.starterFiles),
      checklist: challenge.checklist,
      isPublished: challenge.isPublished,
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
  const updated = await FrontendChallenge.findByIdAndUpdate(
    id,
    { $set: parsed.data },
    { new: true },
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
  const deleted = await FrontendChallenge.findByIdAndDelete(id);
  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await Submission.deleteMany({ challenge: deleted._id });
  return NextResponse.json({ ok: true });
}
