import { supabaseAdmin } from "@/lib/supabase/admin";

export interface SbBookmarkRow {
  id: string;
  kind: string;
  list: string;
  question_id: string | null;
  challenge_id: string | null;
  created_at: string;
}

interface QuestionRef {
  _id: string;
  slug: string;
  title: string;
  difficulty: string;
  category: string;
  tags: string[];
}
interface ChallengeRef {
  _id: string;
  slug: string;
  title: string;
  difficulty: string;
  tech: string;
}

export interface BookmarkView {
  _id: string;
  kind: string;
  list: string;
  question: QuestionRef | null;
  challenge: ChallengeRef | null;
  createdAt: string;
}

/** Reshape Supabase bookmark rows + populate question/challenge, like Mongo. */
export async function attachRefs(rows: SbBookmarkRow[]): Promise<BookmarkView[]> {
  const sb = supabaseAdmin();
  const qIds = [...new Set(rows.map((r) => r.question_id).filter(Boolean))] as string[];
  const cIds = [...new Set(rows.map((r) => r.challenge_id).filter(Boolean))] as string[];

  const qMap = new Map<string, QuestionRef>();
  const cMap = new Map<string, ChallengeRef>();

  const [qs, cs] = await Promise.all([
    qIds.length
      ? sb.from("questions").select("id,slug,title,difficulty,category,tags").in("id", qIds)
      : Promise.resolve({ data: [] }),
    cIds.length
      ? sb.from("frontend_challenges").select("id,slug,title,difficulty,tech").in("id", cIds)
      : Promise.resolve({ data: [] }),
  ]);
  for (const q of (qs.data ?? []) as {
    id: string; slug: string; title: string; difficulty: string; category: string; tags: string[] | null;
  }[]) {
    qMap.set(q.id, {
      _id: q.id, slug: q.slug, title: q.title, difficulty: q.difficulty,
      category: q.category, tags: q.tags ?? [],
    });
  }
  for (const c of (cs.data ?? []) as {
    id: string; slug: string; title: string; difficulty: string; tech: string;
  }[]) {
    cMap.set(c.id, { _id: c.id, slug: c.slug, title: c.title, difficulty: c.difficulty, tech: c.tech });
  }

  return rows.map((b) => ({
    _id: b.id,
    kind: b.kind,
    list: b.list,
    question: b.question_id ? qMap.get(b.question_id) ?? null : null,
    challenge: b.challenge_id ? cMap.get(b.challenge_id) ?? null : null,
    createdAt: b.created_at,
  }));
}
