import { Types } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { QaContributor, BugReport } from "@/models";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { backendFor } from "@/lib/data-backend";

const be = () => backendFor("account");

export interface ContributorRow {
  status: string;
  focusAreas: string[];
  createdAt: string | Date;
  reviewedAt: string | Date | null;
}

/** The signed-in user's QA contributor record, if any. */
export async function getContributor(userId: string): Promise<ContributorRow | null> {
  if (be() === "supabase") {
    const { data } = await supabaseAdmin()
      .from("qa_contributors")
      .select("status,focus_areas,created_at,reviewed_at")
      .eq("user_id", userId)
      .maybeSingle();
    if (!data) return null;
    const c = data as { status: string; focus_areas: string[] | null; created_at: string; reviewed_at: string | null };
    return { status: c.status, focusAreas: c.focus_areas ?? [], createdAt: c.created_at, reviewedAt: c.reviewed_at };
  }
  await connectDB();
  const c = await QaContributor.findOne({ user: userId }).select("status focusAreas createdAt reviewedAt").lean();
  if (!c) return null;
  return { status: c.status, focusAreas: c.focusAreas ?? [], createdAt: c.createdAt, reviewedAt: c.reviewedAt ?? null };
}

/** Just the contributor status (for gating). */
export async function getContributorStatus(userId: string): Promise<string | null> {
  if (be() === "supabase") {
    const { data } = await supabaseAdmin()
      .from("qa_contributors")
      .select("status")
      .eq("user_id", userId)
      .maybeSingle();
    return (data as { status: string } | null)?.status ?? null;
  }
  await connectDB();
  const c = await QaContributor.findOne({ user: userId }).select("status").lean();
  return c?.status ?? null;
}

export interface CreateContributor {
  userId: string;
  name: string;
  email: string;
  motivation: string;
  focusAreas: string[];
  experience: string;
  github: string;
}

/** Create a QA contributor application. */
export async function createContributor(input: CreateContributor): Promise<void> {
  if (be() === "supabase") {
    const { error } = await supabaseAdmin().from("qa_contributors").insert({
      user_id: input.userId,
      name: input.name,
      email: input.email,
      motivation: input.motivation,
      focus_areas: input.focusAreas,
      experience: input.experience,
      github: input.github,
    });
    if (error) throw new Error(error.message);
    return;
  }
  await connectDB();
  await QaContributor.create({
    user: new Types.ObjectId(input.userId),
    name: input.name,
    email: input.email,
    motivation: input.motivation,
    focusAreas: input.focusAreas,
    experience: input.experience,
    github: input.github,
  });
}

export interface BugItem {
  id: string;
  title: string;
  area: string;
  severity: string;
  status: string;
  createdAt: string | Date;
}

/** List the bugs a user has reported. */
export async function listUserBugs(userId: string, limit: number): Promise<BugItem[]> {
  if (be() === "supabase") {
    const { data } = await supabaseAdmin()
      .from("bug_reports")
      .select("id,title,area,severity,status,created_at")
      .eq("reporter_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    return ((data ?? []) as { id: string; title: string; area: string; severity: string; status: string; created_at: string }[]).map((b) => ({
      id: b.id, title: b.title, area: b.area, severity: b.severity, status: b.status, createdAt: b.created_at,
    }));
  }
  await connectDB();
  const bugs = await BugReport.find({ reporter: new Types.ObjectId(userId) }).sort({ createdAt: -1 }).limit(limit).lean();
  return bugs.map((b) => ({
    id: b._id.toString(), title: b.title, area: b.area, severity: b.severity, status: b.status, createdAt: b.createdAt,
  }));
}

export interface CreateBug {
  userId: string;
  reporterName: string;
  title: string;
  area: string;
  severity: string;
  steps: string;
  expected: string;
  actual: string;
  environment: string;
  url: string;
  screenshotUrl: string;
}

/** File a bug report. Returns its id. */
export async function createBugReport(input: CreateBug): Promise<string> {
  if (be() === "supabase") {
    const { data, error } = await supabaseAdmin()
      .from("bug_reports")
      .insert({
        reporter_id: input.userId,
        reporter_name: input.reporterName,
        title: input.title,
        area: input.area,
        severity: input.severity,
        steps: input.steps,
        expected: input.expected,
        actual: input.actual,
        environment: input.environment,
        url: input.url,
        screenshot_url: input.screenshotUrl,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return (data as { id: string }).id;
  }
  await connectDB();
  const bug = new BugReport({
    reporter: new Types.ObjectId(input.userId),
    reporterName: input.reporterName,
    title: input.title,
    area: input.area,
    severity: input.severity,
    steps: input.steps,
    expected: input.expected,
    actual: input.actual,
    environment: input.environment,
    url: input.url,
    screenshotUrl: input.screenshotUrl,
  });
  await bug.save();
  return bug._id.toString();
}
