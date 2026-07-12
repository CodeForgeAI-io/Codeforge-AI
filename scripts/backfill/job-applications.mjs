/**
 * Backfill: JobApplication documents MongoDB → Supabase.
 * Idempotent (upsert on legacy_mongo_id). Dry-run by default; --apply to write.
 *   node scripts/backfill/job-applications.mjs [--apply]
 */
import { readFileSync } from "node:fs";
import mongoose from "mongoose";
import { createClient } from "@supabase/supabase-js";

const env = {};
for (const f of [".env", ".env.local"]) {
  try {
    for (const l of readFileSync(f, "utf8").split("\n")) {
      const m = /^([A-Z0-9_]+)=(.+)$/.exec(l.trim());
      if (m && !env[m[1]]) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {}
}
const APPLY = process.argv.includes("--apply");
const str = (v) => (typeof v === "string" ? v : "");

async function main() {
  await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
  const docs = await mongoose.connection.db.collection("jobapplications").find({}).toArray();
  console.log(`MongoDB: ${docs.length} job applications`);

  const rows = docs.map((d) => ({
    legacy_mongo_id: d._id.toString(),
    role: d.role, role_title: str(d.roleTitle), name: str(d.name), email: str(d.email),
    phone: str(d.phone), location: str(d.location), experience: str(d.experience),
    linkedin: str(d.linkedin), github: str(d.github), portfolio: str(d.portfolio),
    company: str(d.company), resume_url: str(d.resumeUrl), resume_name: str(d.resumeName),
    message: str(d.message), status: d.status ?? "new", created_at: d.createdAt ?? new Date(),
  }));

  if (!APPLY) {
    console.log("DRY RUN — pass --apply to write. Sample:", JSON.stringify(rows[0] ?? {}).slice(0, 240));
    await mongoose.disconnect();
    return;
  }
  const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await sb.from("job_applications").upsert(rows.slice(i, i + 500), { onConflict: "legacy_mongo_id" });
    if (error) throw new Error(error.message);
    console.log(`upserted ${Math.min(i + 500, rows.length)}/${rows.length}`);
  }
  console.log("Backfill complete ✓");
  await mongoose.disconnect();
}
main().catch((e) => { console.error("failed:", e.message); process.exit(1); });
