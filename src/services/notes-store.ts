import { supabaseAdmin } from "@/lib/supabase/admin";

/** Raw notes row as selected from Supabase. */
export interface SbNoteRow {
  id: string;
  question_id: string | null;
  challenge_id: string | null;
  title: string;
  content: string;
  is_private: boolean;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

/** Mongo-compatible note shape the client consumes (populated question). */
export interface NoteView {
  _id: string;
  question: { _id: string; slug: string; title: string } | null;
  challenge: string | null;
  title: string;
  content: string;
  isPrivate: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

/** Reshape Supabase note rows and populate their questions, mimicking Mongo. */
export async function attachQuestions(rows: SbNoteRow[]): Promise<NoteView[]> {
  const ids = [...new Set(rows.map((r) => r.question_id).filter(Boolean))] as string[];
  const qMap = new Map<string, { _id: string; slug: string; title: string }>();
  if (ids.length) {
    const { data } = await supabaseAdmin()
      .from("questions")
      .select("id,slug,title")
      .in("id", ids);
    for (const q of (data ?? []) as { id: string; slug: string; title: string }[]) {
      qMap.set(q.id, { _id: q.id, slug: q.slug, title: q.title });
    }
  }
  return rows.map((n) => ({
    _id: n.id,
    question: n.question_id ? qMap.get(n.question_id) ?? null : null,
    challenge: n.challenge_id,
    title: n.title,
    content: n.content,
    isPrivate: n.is_private,
    tags: n.tags ?? [],
    createdAt: n.created_at,
    updatedAt: n.updated_at,
  }));
}
