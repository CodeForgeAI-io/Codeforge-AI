import { connectDB } from "@/lib/mongodb";
import { JobApplication } from "@/models";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { backendFor } from "@/lib/data-backend";

/**
 * Job-application data access (careers). Standalone module — no cross-refs — so
 * it can be flipped independently via DATA_BACKEND_JOBAPPLICATION=supabase.
 * One repository, two backends. Default stays MongoDB.
 */

export interface JobApplicationInput {
  role: string;
  roleTitle: string;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  experience?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  company?: string;
  resumeUrl?: string;
  resumeName?: string;
  message?: string;
}

export interface JobApplicationItem extends Omit<JobApplicationInput, never> {
  id: string;
  status: string;
  createdAt: string | Date;
}

export interface JobApplicationList {
  items: JobApplicationItem[];
  counts: { new: number; reviewing: number; shortlisted: number; rejected: number };
}

const be = () => backendFor("jobapplication");
const s = (v: unknown) => (typeof v === "string" ? v : "");

// column mapping helpers (camelCase ↔ snake_case) ----------------------------
function toRow(i: JobApplicationInput) {
  return {
    role: i.role, role_title: i.roleTitle, name: i.name, email: i.email,
    phone: i.phone ?? "", location: i.location ?? "", experience: i.experience ?? "",
    linkedin: i.linkedin ?? "", github: i.github ?? "", portfolio: i.portfolio ?? "",
    company: i.company ?? "", resume_url: i.resumeUrl ?? "", resume_name: i.resumeName ?? "",
    message: i.message ?? "",
  };
}
interface SbRow {
  id: string; role: string; role_title: string; name: string; email: string;
  phone: string; location: string; linkedin: string; github: string; portfolio: string;
  experience: string; company: string; resume_url: string; resume_name: string;
  message: string; status: string; created_at: string;
}
function fromRow(r: SbRow): JobApplicationItem {
  return {
    id: r.id, role: r.role, roleTitle: r.role_title, name: r.name, email: r.email,
    phone: r.phone ?? "", location: r.location ?? "", linkedin: r.linkedin ?? "",
    github: r.github ?? "", portfolio: r.portfolio ?? "", experience: r.experience ?? "",
    company: r.company ?? "", resumeUrl: r.resume_url ?? "", resumeName: r.resume_name ?? "",
    message: r.message ?? "", status: r.status, createdAt: r.created_at,
  };
}

export async function createApplication(input: JobApplicationInput): Promise<void> {
  if (be() === "supabase") {
    const { error } = await supabaseAdmin().from("job_applications").insert(toRow(input));
    if (error) throw new Error(error.message);
    return;
  }
  await connectDB();
  await JobApplication.create({
    role: input.role, roleTitle: input.roleTitle, name: input.name, email: input.email,
    phone: input.phone, location: input.location, experience: input.experience,
    linkedin: input.linkedin ?? "", github: input.github ?? "", portfolio: input.portfolio ?? "",
    company: input.company ?? "", resumeUrl: input.resumeUrl ?? "", resumeName: input.resumeName ?? "",
    message: input.message ?? "",
  });
}

export async function listApplications(filter: { role?: string; status?: string }): Promise<JobApplicationList> {
  const emptyCounts = { new: 0, reviewing: 0, shortlisted: 0, rejected: 0 };
  if (be() === "supabase") {
    const sb = supabaseAdmin();
    let q = sb.from("job_applications").select("*").order("created_at", { ascending: false }).limit(500);
    if (filter.role && filter.role !== "all") q = q.eq("role", filter.role);
    if (filter.status && filter.status !== "all") q = q.eq("status", filter.status);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    const items = ((data ?? []) as unknown as SbRow[]).map(fromRow);
    const { data: st } = await sb.from("job_applications").select("status");
    const counts = { ...emptyCounts };
    for (const r of (st ?? []) as { status: string }[]) if (r.status in counts) counts[r.status as keyof typeof counts]++;
    return { items, counts };
  }
  await connectDB();
  const query: Record<string, unknown> = {};
  if (filter.role && filter.role !== "all") query.role = filter.role;
  if (filter.status && filter.status !== "all") query.status = filter.status;
  const docs = await JobApplication.find(query).sort({ createdAt: -1 }).limit(500).lean();
  const items: JobApplicationItem[] = docs.map((a) => ({
    id: a._id.toString(), role: a.role, roleTitle: a.roleTitle, name: a.name, email: a.email,
    phone: s(a.phone), location: s(a.location), linkedin: s(a.linkedin), github: s(a.github),
    portfolio: s(a.portfolio), experience: s(a.experience), company: s(a.company),
    resumeUrl: s(a.resumeUrl), resumeName: s(a.resumeName), message: s(a.message),
    status: a.status, createdAt: a.createdAt,
  }));
  const agg = await JobApplication.aggregate<{ _id: string; n: number }>([{ $group: { _id: "$status", n: { $sum: 1 } } }]);
  const counts = { ...emptyCounts };
  for (const c of agg) if (c._id in counts) counts[c._id as keyof typeof counts] = c.n;
  return { items, counts };
}

export async function updateApplicationStatus(id: string, status: string): Promise<void> {
  if (be() === "supabase") {
    const { error } = await supabaseAdmin().from("job_applications").update({ status }).eq("id", id);
    if (error) throw new Error(error.message);
    return;
  }
  await connectDB();
  await JobApplication.updateOne({ _id: id }, { $set: { status } });
}

export async function deleteApplication(id: string): Promise<void> {
  if (be() === "supabase") {
    const { error } = await supabaseAdmin().from("job_applications").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return;
  }
  await connectDB();
  await JobApplication.deleteOne({ _id: id });
}

export async function getApplicationResume(id: string): Promise<{ resumeUrl: string; resumeName: string } | null> {
  if (be() === "supabase") {
    const { data, error } = await supabaseAdmin().from("job_applications").select("resume_url,resume_name").eq("id", id).maybeSingle();
    if (error || !data) return null;
    const row = data as { resume_url: string | null; resume_name: string | null };
    return { resumeUrl: row.resume_url ?? "", resumeName: row.resume_name ?? "" };
  }
  await connectDB();
  const app = await JobApplication.findById(id).select("resumeUrl resumeName").lean();
  return app ? { resumeUrl: s(app.resumeUrl), resumeName: s(app.resumeName) } : null;
}
