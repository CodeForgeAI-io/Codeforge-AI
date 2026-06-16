import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireUser } from "@/lib/api-auth";
import { Note } from "@/models";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireUser();
  if (error) return error;

  const { id } = await params;
  const body = await req.json();

  await connectDB();
  const note = await Note.findOne({ _id: id, user: session.user.id });
  if (!note) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { title, content, isPrivate, tags } = body;
  if (title !== undefined) note.title = title;
  if (content !== undefined) note.content = content;
  if (isPrivate !== undefined) note.isPrivate = isPrivate;
  if (tags !== undefined) note.tags = tags;

  await note.save();
  return NextResponse.json({ note });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireUser();
  if (error) return error;

  const { id } = await params;
  await connectDB();
  await Note.deleteOne({ _id: id, user: session.user.id });
  return NextResponse.json({ ok: true });
}
