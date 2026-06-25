import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/api-auth";
import { User } from "@/models";
import { deleteUserAndData } from "@/services/account";

const patchSchema = z.object({
  role: z.enum(["user", "admin"]).optional(),
  banned: z.boolean().optional(),
  plan: z.enum(["free", "go", "plus"]).optional(),
  billingCycle: z.enum(["monthly", "yearly"]).nullable().optional(),
  planExpiresAt: z.string().nullable().optional(),
  betaUser: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  if (id === session.user.id) {
    return NextResponse.json(
      { error: "You cannot change your own role or ban yourself" },
      { status: 400 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
    );
  }

  const updateFields: Record<string, unknown> = {};
  if (parsed.data.role !== undefined) updateFields.role = parsed.data.role;
  if (parsed.data.banned !== undefined) updateFields.banned = parsed.data.banned;
  if (parsed.data.plan !== undefined) updateFields.plan = parsed.data.plan;
  if (parsed.data.billingCycle !== undefined) updateFields.billingCycle = parsed.data.billingCycle;
  if (parsed.data.betaUser !== undefined) updateFields.betaUser = parsed.data.betaUser;
  if (parsed.data.planExpiresAt !== undefined) {
    updateFields.planExpiresAt = parsed.data.planExpiresAt
      ? new Date(parsed.data.planExpiresAt)
      : null;
  }

  await connectDB();
  const updated = await User.findByIdAndUpdate(
    id,
    { $set: updateFields },
    { returnDocument: "after" },
  );
  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

/** Permanently delete a user and their owned data (admin only). */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  if (id === session.user.id) {
    return NextResponse.json(
      { error: "You cannot delete your own admin account from here" },
      { status: 400 },
    );
  }

  const deleted = await deleteUserAndData(id);
  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
