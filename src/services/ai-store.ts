import { Types } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { AiChat, AiToolRun } from "@/models";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { backendFor } from "@/lib/data-backend";

const be = () => backendFor("ai");

export interface StoredChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
  createdAt?: string | Date;
}

export interface AiChatRecord {
  id: string;
  messages: StoredChatMessage[];
}

interface ChatKey {
  userId: string;
  context: string;
  questionId?: string | null;
  challengeId?: string | null;
}

/** Find (or create) the AiChat row for a context and return id + messages. */
export async function findOrCreateAiChat(key: ChatKey): Promise<AiChatRecord> {
  if (be() === "supabase") {
    const sb = supabaseAdmin();
    let q = sb
      .from("ai_chats")
      .select("id,messages")
      .eq("user_id", key.userId)
      .eq("context", key.context);
    q = key.questionId ? q.eq("question_id", key.questionId) : q.is("question_id", null);
    q = key.challengeId ? q.eq("challenge_id", key.challengeId) : q.is("challenge_id", null);
    const { data } = await q.maybeSingle();
    if (data) {
      const row = data as { id: string; messages: StoredChatMessage[] | null };
      return { id: row.id, messages: row.messages ?? [] };
    }
    const { data: created, error } = await sb
      .from("ai_chats")
      .insert({
        user_id: key.userId,
        context: key.context,
        question_id: key.questionId ?? null,
        challenge_id: key.challengeId ?? null,
        messages: [],
      })
      .select("id,messages")
      .single();
    if (error) throw new Error(error.message);
    return { id: (created as { id: string }).id, messages: [] };
  }

  await connectDB();
  const query: Record<string, unknown> = {
    user: new Types.ObjectId(key.userId),
    context: key.context,
  };
  if (key.questionId) query.question = new Types.ObjectId(key.questionId);
  if (key.challengeId) query.challenge = new Types.ObjectId(key.challengeId);
  const chat = (await AiChat.findOne(query)) ?? (await AiChat.create(query));
  return {
    id: chat._id.toString(),
    messages: chat.messages as unknown as StoredChatMessage[],
  };
}

/** Persist the full message list for a chat (already trimmed by the caller). */
export async function saveAiChatMessages(
  id: string,
  messages: StoredChatMessage[],
): Promise<void> {
  if (be() === "supabase") {
    const { error } = await supabaseAdmin()
      .from("ai_chats")
      .update({ messages })
      .eq("id", id);
    if (error) throw new Error(error.message);
    return;
  }
  await connectDB();
  await AiChat.updateOne({ _id: id }, { $set: { messages } });
}

/** Read a chat's messages for panel hydration (role + content only). */
export async function getAiChatMessages(key: ChatKey): Promise<{ role: string; content: string }[]> {
  if (be() === "supabase") {
    const sb = supabaseAdmin();
    let q = sb
      .from("ai_chats")
      .select("messages")
      .eq("user_id", key.userId)
      .eq("context", key.context);
    q = key.questionId ? q.eq("question_id", key.questionId) : q.is("question_id", null);
    q = key.challengeId ? q.eq("challenge_id", key.challengeId) : q.is("challenge_id", null);
    const { data } = await q.maybeSingle();
    const messages = (data as { messages: StoredChatMessage[] | null } | null)?.messages ?? [];
    return messages.map((m) => ({ role: m.role, content: m.content }));
  }
  await connectDB();
  const query: Record<string, unknown> = {
    user: new Types.ObjectId(key.userId),
    context: key.context,
  };
  if (key.questionId) query.question = new Types.ObjectId(key.questionId);
  if (key.challengeId) query.challenge = new Types.ObjectId(key.challengeId);
  const chat = await AiChat.findOne(query).lean();
  return (chat?.messages ?? []).map((m) => ({ role: m.role, content: m.content }));
}

export interface ToolRunItem {
  id: string;
  title: string;
  result: unknown;
  createdAt: string | Date;
}

/** List recent saved runs for a tool. */
export async function listToolRuns(
  userId: string,
  tool: string,
  limit: number,
): Promise<ToolRunItem[]> {
  if (be() === "supabase") {
    const { data } = await supabaseAdmin()
      .from("ai_tool_runs")
      .select("id,title,result,created_at")
      .eq("user_id", userId)
      .eq("tool", tool)
      .order("created_at", { ascending: false })
      .limit(limit);
    return ((data ?? []) as { id: string; title: string; result: unknown; created_at: string }[]).map((r) => ({
      id: r.id,
      title: r.title,
      result: r.result,
      createdAt: r.created_at,
    }));
  }
  await connectDB();
  const runs = await AiToolRun.find({ user: new Types.ObjectId(userId), tool })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select("title result createdAt")
    .lean();
  return runs.map((r) => ({
    id: r._id.toString(),
    title: r.title,
    result: r.result,
    createdAt: r.createdAt,
  }));
}

/** Insert or update a tool run, then trim to keep only the newest `keep`. */
export async function upsertToolRun(opts: {
  id?: string;
  userId: string;
  tool: string;
  title: string;
  input?: unknown;
  result: unknown;
  keep: number;
}): Promise<string> {
  if (be() === "supabase") {
    const sb = supabaseAdmin();
    let savedId = opts.id;
    if (opts.id) {
      const { data } = await sb
        .from("ai_tool_runs")
        .update({ title: opts.title, input: opts.input ?? null, result: opts.result })
        .eq("id", opts.id)
        .eq("user_id", opts.userId)
        .eq("tool", opts.tool)
        .select("id")
        .maybeSingle();
      if (data) return (data as { id: string }).id;
    }
    const { data: created, error } = await sb
      .from("ai_tool_runs")
      .insert({
        user_id: opts.userId,
        tool: opts.tool,
        title: opts.title,
        input: opts.input ?? null,
        result: opts.result,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    savedId = (created as { id: string }).id;
    // Trim older runs beyond `keep`.
    const { data: all } = await sb
      .from("ai_tool_runs")
      .select("id")
      .eq("user_id", opts.userId)
      .eq("tool", opts.tool)
      .order("created_at", { ascending: false });
    const stale = ((all ?? []) as { id: string }[]).slice(opts.keep).map((r) => r.id);
    if (stale.length) await sb.from("ai_tool_runs").delete().in("id", stale);
    return savedId!;
  }

  await connectDB();
  const userId = new Types.ObjectId(opts.userId);
  if (opts.id && Types.ObjectId.isValid(opts.id)) {
    const updated = await AiToolRun.findOneAndUpdate(
      { _id: opts.id, user: userId, tool: opts.tool },
      { title: opts.title, input: opts.input, result: opts.result },
      { new: true },
    );
    if (updated) return updated._id.toString();
  }
  const run = await AiToolRun.create({
    user: userId,
    tool: opts.tool,
    title: opts.title,
    input: opts.input,
    result: opts.result,
  });
  const stale = await AiToolRun.find({ user: userId, tool: opts.tool })
    .sort({ createdAt: -1 })
    .skip(opts.keep)
    .select("_id")
    .lean();
  if (stale.length) {
    await AiToolRun.deleteMany({ _id: { $in: stale.map((s) => s._id) } });
  }
  return run._id.toString();
}
