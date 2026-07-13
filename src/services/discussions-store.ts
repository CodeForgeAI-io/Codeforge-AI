import { supabaseAdmin } from "@/lib/supabase/admin";

/** Embedded reply as stored in the discussions.replies jsonb. */
export interface SbReply {
  _id: string;
  author: string;
  content: string;
  parentReply?: string;
  createdAt: string;
}

export interface SbDiscussionRow {
  id: string;
  question_id: string | null;
  author_id: string | null;
  title: string;
  content: string;
  tags: string[] | null;
  kind: string;
  language: string | null;
  upvotes: string[] | null;
  downvotes: string[] | null;
  replies: SbReply[] | null;
  is_pinned: boolean;
  ai_summary: string | null;
  ai_summary_at: string | null;
  views: number;
  created_at: string;
}

export interface AuthorRef {
  _id: string;
  username: string;
  name: string;
  image: string | null;
}

export const DISCUSSION_LIST_COLS =
  "id,question_id,author_id,title,content,tags,kind,language,upvotes,downvotes,is_pinned,ai_summary,ai_summary_at,views,created_at";
export const DISCUSSION_FULL_COLS = `${DISCUSSION_LIST_COLS},replies`;

/** Fetch author user rows keyed by id, shaped like a populated Mongo subdoc. */
export async function fetchAuthors(ids: string[]): Promise<Map<string, AuthorRef>> {
  const map = new Map<string, AuthorRef>();
  const unique = [...new Set(ids.filter(Boolean))];
  if (!unique.length) return map;
  const { data } = await supabaseAdmin()
    .from("users")
    .select("id,username,name,image")
    .in("id", unique);
  for (const u of (data ?? []) as { id: string; username: string; name: string; image: string | null }[]) {
    map.set(u.id, { _id: u.id, username: u.username, name: u.name, image: u.image });
  }
  return map;
}

/** Common discussion fields shaped for the client (author populated). */
function baseShape(row: SbDiscussionRow, authors: Map<string, AuthorRef>) {
  return {
    _id: row.id,
    question: row.question_id,
    author: row.author_id ? authors.get(row.author_id) ?? null : null,
    title: row.title,
    content: row.content,
    tags: row.tags ?? [],
    kind: row.kind,
    language: row.language,
    upvotes: row.upvotes ?? [],
    downvotes: row.downvotes ?? [],
    isPinned: row.is_pinned,
    aiSummary: row.ai_summary,
    aiSummaryAt: row.ai_summary_at,
    views: row.views,
    createdAt: row.created_at,
  };
}

/** List item (no replies). */
export function listShape(row: SbDiscussionRow, authors: Map<string, AuthorRef>) {
  return baseShape(row, authors);
}

/** Detail item with replies (reply authors populated). */
export function detailShape(row: SbDiscussionRow, authors: Map<string, AuthorRef>) {
  const replies = (row.replies ?? []).map((r) => ({
    _id: r._id,
    author: authors.get(r.author) ?? null,
    content: r.content,
    parentReply: r.parentReply ?? null,
    createdAt: r.createdAt,
  }));
  return { ...baseShape(row, authors), replies };
}
