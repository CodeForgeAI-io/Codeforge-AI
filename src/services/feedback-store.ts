import { connectDB } from "@/lib/mongodb";
import { Feedback } from "@/models";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { backendFor, toUuidOrNull } from "@/lib/data-backend";

/**
 * Feedback data access — the Phase-2 pilot of the Supabase migration.
 * One repository, two backends (Mongo / Supabase), chosen by `backendFor`.
 * Routes call these functions instead of the model directly, so flipping
 * `DATA_BACKEND_FEEDBACK=supabase` moves the whole module with no code change.
 */

export interface FeedbackInput {
  type: "feature" | "bug" | "issue";
  title: string;
  description: string;
  email?: string;
  userId?: string | null;
}

export interface FeedbackItem {
  id: string;
  type: string;
  title: string;
  description: string;
  email: string;
  user: { name: string; username: string } | null;
  status: string;
  createdAt: string | Date;
}

export interface FeedbackList {
  items: FeedbackItem[];
  counts: { new: number; read: number; resolved: number };
}

const be = () => backendFor("feedback");

export async function createFeedback(input: FeedbackInput): Promise<void> {
  if (be() === "supabase") {
    const { error } = await supabaseAdmin().from("feedback").insert({
      type: input.type,
      title: input.title,
      description: input.description,
      email: input.email ?? "",
      // ObjectId can't go in a uuid column; re-linked during the users backfill.
      user_id: toUuidOrNull(input.userId),
    });
    if (error) throw new Error(error.message);
    return;
  }
  await connectDB();
  await Feedback.create({
    type: input.type,
    title: input.title,
    description: input.description,
    email: input.email ?? "",
    user: input.userId ?? null,
  });
}

interface SbFeedbackRow {
  id: string;
  type: string;
  title: string;
  description: string;
  email: string | null;
  status: string;
  created_at: string;
  users: { name: string | null; username: string | null } | null;
}

export async function listFeedback(filter: { status?: string; type?: string }): Promise<FeedbackList> {
  if (be() === "supabase") {
    const sb = supabaseAdmin();
    let q = sb
      .from("feedback")
      .select("id,type,title,description,email,status,created_at,users(name,username)")
      .order("created_at", { ascending: false })
      .limit(500);
    if (filter.status && filter.status !== "all") q = q.eq("status", filter.status);
    if (filter.type && filter.type !== "all") q = q.eq("type", filter.type);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as unknown as SbFeedbackRow[];
    const items: FeedbackItem[] = rows.map((f) => ({
      id: f.id,
      type: f.type,
      title: f.title,
      description: f.description,
      email: f.email ?? "",
      user: f.users ? { name: f.users.name ?? "", username: f.users.username ?? "" } : null,
      status: f.status,
      createdAt: f.created_at,
    }));
    const { data: statusRows } = await sb.from("feedback").select("status");
    const counts = { new: 0, read: 0, resolved: 0 };
    for (const r of (statusRows ?? []) as { status: string }[]) {
      if (r.status === "new" || r.status === "read" || r.status === "resolved") counts[r.status]++;
    }
    return { items, counts };
  }

  await connectDB();
  const query: Record<string, unknown> = {};
  if (filter.status && filter.status !== "all") query.status = filter.status;
  if (filter.type && filter.type !== "all") query.type = filter.type;
  const docs = await Feedback.find(query).populate("user", "name username").sort({ createdAt: -1 }).limit(500).lean();
  const items: FeedbackItem[] = docs.map((f) => ({
    id: f._id.toString(),
    type: f.type,
    title: f.title,
    description: f.description,
    email: f.email ?? "",
    user: f.user
      ? { name: (f.user as { name?: string }).name ?? "", username: (f.user as { username?: string }).username ?? "" }
      : null,
    status: f.status,
    createdAt: f.createdAt,
  }));
  const agg = await Feedback.aggregate<{ _id: string; n: number }>([{ $group: { _id: "$status", n: { $sum: 1 } } }]);
  const byStatus = Object.fromEntries(agg.map((c) => [c._id, c.n]));
  return { items, counts: { new: byStatus.new ?? 0, read: byStatus.read ?? 0, resolved: byStatus.resolved ?? 0 } };
}

export async function updateFeedbackStatus(id: string, status: string): Promise<void> {
  if (be() === "supabase") {
    const { error } = await supabaseAdmin().from("feedback").update({ status }).eq("id", id);
    if (error) throw new Error(error.message);
    return;
  }
  await connectDB();
  await Feedback.updateOne({ _id: id }, { $set: { status } });
}

export async function deleteFeedback(id: string): Promise<void> {
  if (be() === "supabase") {
    const { error } = await supabaseAdmin().from("feedback").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return;
  }
  await connectDB();
  await Feedback.deleteOne({ _id: id });
}
