/**
 * Backfill: copy Feedback documents from MongoDB → Supabase.
 *
 * Idempotent: upserts on `legacy_mongo_id`, so it's safe to re-run.
 * Dry-run by default (prints the count); pass `--apply` to write.
 *
 *   node scripts/backfill/feedback.mjs           # dry run
 *   node scripts/backfill/feedback.mjs --apply   # copy
 *
 * NOTE: `user_id` is left null until the users table is migrated (Phase 6).
 * The original Object ids are preserved in `legacy_mongo_id` so the link can
 * be reconstructed once users exist in Postgres.
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

async function main() {
  await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
  const docs = await mongoose.connection.db.collection("feedbacks").find({}).toArray();
  console.log(`MongoDB: ${docs.length} feedback documents`);

  const rows = docs.map((d) => ({
    legacy_mongo_id: d._id.toString(),
    type: d.type,
    title: d.title ?? "",
    description: d.description ?? "",
    email: d.email ?? "",
    user_id: null,
    status: d.status ?? "new",
    created_at: d.createdAt ?? new Date(),
  }));

  if (!APPLY) {
    console.log("DRY RUN — pass --apply to write. Sample:", JSON.stringify(rows[0] ?? {}, null, 2).slice(0, 300));
    await mongoose.disconnect();
    return;
  }

  const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  let done = 0;
  for (let i = 0; i < rows.length; i += 500) {
    const batch = rows.slice(i, i + 500);
    const { error } = await sb.from("feedback").upsert(batch, { onConflict: "legacy_mongo_id" });
    if (error) throw new Error(error.message);
    done += batch.length;
    console.log(`upserted ${done}/${rows.length}`);
  }
  console.log("Backfill complete ✓");
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error("Backfill failed:", e.message);
  process.exit(1);
});
