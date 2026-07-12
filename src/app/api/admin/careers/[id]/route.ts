import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { updateApplicationStatus, deleteApplication } from "@/services/job-application-store";

export const runtime = "nodejs";

const STATUSES = ["new", "reviewing", "shortlisted", "rejected"];
// ObjectId (24 hex) or uuid (36) — backend chosen by DATA_BACKEND_JOBAPPLICATION.
const isValidId = (id: string) => /^[0-9a-fA-F]{24}$/.test(id) || /^[0-9a-fA-F-]{36}$/.test(id);

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  if (!isValidId(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  let body: { status?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!STATUSES.includes(String(body.status))) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  await updateApplicationStatus(id, body.status!);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  if (!isValidId(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  await deleteApplication(id);
  return NextResponse.json({ ok: true });
}
