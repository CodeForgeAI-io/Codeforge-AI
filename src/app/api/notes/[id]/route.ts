import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireUser } from "@/lib/api-auth";
import { Note } from "@/models";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { backendFor } from "@/lib/data-backend";
import { attachQuestions, type SbNoteRow } from "@/services/notes-store";

const be = () => backendFor("notes");

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireUser();
  if (error) return error;

  const { id } = await params;
  const body = await req.json();
  const { title, content, isPrivate, tags } = body;

  if (be() === "supabase") {
    const patch: Record<string, unknown> = {};
    if (title !== undefined) patch.title = title;
    if (content !== undefined) patch.content = content;
    if (isPrivate !== undefined) patch.is_private = isPrivate;
    if (tags !== undefined) patch.tags = tags;
    const { data, error: upErr } = await supabaseAdmin()
      .from("notes")
      .update(patch)
      .eq("id", id)
      .eq("user_id", session.user.id)
      .select("id,question_id,challenge_id,title,content,is_private,tags,created_at,updated_at")
      .maybeSingle();
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const [note] = await attachQuestions([data as SbNoteRow]);
    return NextResponse.json({ note });
  }

  await connectDB();
  const note = await Note.findOne({ _id: id, user: session.user.id });
  if (!note) return NextResponse.json({ error: "Not found" }, { status: 404 });

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
  if (be() === "supabase") {
    await supabaseAdmin()
      .from("notes")
      .delete()
      .eq("id", id)
      .eq("user_id", session.user.id);
    return NextResponse.json({ ok: true });
  }
  await connectDB();
  await Note.deleteOne({ _id: id, user: session.user.id });
  return NextResponse.json({ ok: true });
}
