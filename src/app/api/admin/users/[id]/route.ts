import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/api-auth";
import { adminUpdateUser, type AdminUserPatch } from "@/services/user-store";
import { deleteUserAndData } from "@/services/account";

const patchSchema = z.object({
  role: z.enum(["user", "admin"]).optional(),
  banned: z.boolean().optional(),
  plan: z.enum(["free", "go", "plus"]).optional(),
  billingCycle: z.enum(["monthly", "yearly"]).nullable().optional(),
  planExpiresAt: z.string().nullable().optional(),
  trialEndsAt: z.string().nullable().optional(),
  betaUser: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
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

  const patch: AdminUserPatch = {};
  if (parsed.data.role !== undefined) patch.role = parsed.data.role;
  if (parsed.data.banned !== undefined) patch.banned = parsed.data.banned;
  if (parsed.data.plan !== undefined) patch.plan = parsed.data.plan;
  if (parsed.data.billingCycle !== undefined) patch.billingCycle = parsed.data.billingCycle;
  if (parsed.data.betaUser !== undefined) patch.betaUser = parsed.data.betaUser;
  if (parsed.data.planExpiresAt !== undefined) {
    patch.planExpiresAt = parsed.data.planExpiresAt ? new Date(parsed.data.planExpiresAt) : null;
  }
  if (parsed.data.trialEndsAt !== undefined) {
    patch.trialEndsAt = parsed.data.trialEndsAt ? new Date(parsed.data.trialEndsAt) : null;
  }

  const ok = await adminUpdateUser(id, patch);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
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
