/**
 * Generic core data backfill: MongoDB → Supabase (all tables except users).
 *
 * Run AFTER `users.mjs --apply` (users must exist first — everything FKs to
 * them). Idempotent (upsert on legacy_mongo_id / natural key). Dry-run by
 * default (reports counts + which doc fields map to columns); --apply to write.
 *
 *   node scripts/backfill/all.mjs           # dry run
 *   node scripts/backfill/all.mjs --apply   # copy
 *
 * How it works: reads the users legacy→uuid map from public.users, then walks
 * the tables in dependency order. For each doc it maps camelCase→snake_case,
 * renames reference fields (user→user_id, question→question_id, …), remaps
 * ObjectId references through the accumulating id map, drops fields with no
 * column, and inserts with a fresh uuid recorded back into the map.
 */
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import mongoose from "mongoose";
import postgres from "postgres";

const env = {};
for (const f of [".env", ".env.local"]) {
  try { for (const l of readFileSync(f, "utf8").split("\n")) { const m = /^([A-Z0-9_]+)=(.+)$/.exec(l.trim()); if (m && !env[m[1]]) env[m[1]] = m[2].replace(/^["']|["']$/g, ""); } } catch {}
}
const APPLY = process.argv.includes("--apply");

// Mongo field → column for reference (FK) fields the schema suffixed with _id.
const REF_ALIAS = {
  user: "user_id", question: "question_id", challenge: "challenge_id",
  author: "author_id", reporter: "reporter_id", following: "following_id",
  follower: "follower_id", coupon: "coupon_id", badge: "badge_id",
  discussion: "discussion_id", contest: "contest_id",
};

// Dependency-ordered { collection → table }. users handled by users.mjs.
const TABLES = [
  ["questions", "questions"], ["frontendchallenges", "frontend_challenges"],
  ["contests", "contests"], ["roadmaps", "roadmaps"], ["companies", "companies"],
  ["badges", "badges"], ["coupons", "coupons"], ["blogposts", "blog_posts"],
  ["prompttemplates", "prompt_templates"],
  ["submissions", "submissions"], ["bookmarks", "bookmarks"], ["notes", "notes"],
  ["progresses", "progress"], ["dailyactivities", "daily_activity"],
  ["spacedrepetitions", "spaced_repetition"], ["discussions", "discussions"],
  ["userbadges", "user_badges"], ["follows", "follows"],
  ["couponredemptions", "coupon_redemptions"], ["subscriptions", "subscriptions"],
  ["feedbacks", "feedback"], ["jobapplications", "job_applications"],
  ["bugreports", "bug_reports"], ["qacontributors", "qa_contributors"],
  ["aichats", "ai_chats"], ["aitoolruns", "ai_tool_runs"],
  ["aiusages", "ai_usage"], ["genusages", "gen_usage"],
];

const snake = (k) => k.replace(/[A-Z]/g, (m) => "_" + m.toLowerCase());
const isOid = (v) => v && typeof v === "object" && (v._bsontype === "ObjectId" || v._bsontype === "ObjectID" || typeof v.toHexString === "function");

/** Deep-clean a value for a JSON/JSONB column: ObjectId→(uuid|hex), Date→ISO. */
function clean(v, idMap) {
  if (isOid(v)) { const h = v.toString(); return idMap.get(h) ?? h; }
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "string") return v.replace(/\u0000/g, ""); // Postgres text rejects null bytes
  if (Array.isArray(v)) return v.map((x) => clean(x, idMap));
  if (v && typeof v === "object") { const o = {}; for (const [k, val] of Object.entries(v)) o[k] = clean(val, idMap); return o; }
  return v;
}

async function main() {
  await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
  const mongo = mongoose.connection.db;
  const sql = postgres(env.SUPABASE_DB_URL, { prepare: false, connect_timeout: 15 });

  // Seed the id map with migrated users.
  const idMap = new Map();
  const users = await sql`select id, legacy_mongo_id from users where legacy_mongo_id is not null`;
  for (const u of users) idMap.set(u.legacy_mongo_id, u.id);
  console.log(`seed: ${idMap.size} users mapped${idMap.size === 0 ? "  ⚠️  run users.mjs --apply first" : ""}\n`);

  for (const [collection, table] of TABLES) {
    const cols = new Set((await sql`select column_name from information_schema.columns where table_name=${table}`).map((c) => c.column_name));
    // Re-run safety: reuse ids already assigned to these legacy docs.
    for (const r of await sql`select id, legacy_mongo_id from ${sql(table)} where legacy_mongo_id is not null`) {
      idMap.set(r.legacy_mongo_id, r.id);
    }
    const docs = await mongo.collection(collection).find({}).toArray();
    const dropped = new Set();
    const rows = docs.map((d) => {
      const legacy = d._id.toString();
      const id = idMap.get(legacy) ?? randomUUID();
      idMap.set(legacy, id);
      const row = { id, legacy_mongo_id: legacy };
      for (const [k, v] of Object.entries(d)) {
        if (k === "_id" || k === "__v" || v === undefined) continue;
        const col = REF_ALIAS[k] ?? snake(k);
        if (!cols.has(col)) { dropped.add(k); continue; }
        if (isOid(v)) row[col] = idMap.get(v.toString()) ?? null;
        else { const c = clean(v, idMap); if (c !== undefined) row[col] = c; }
      }
      return row;
    });
    let failed = 0;
    if (APPLY) {
      // Row-by-row: docs are heterogeneous, so each row carries its own columns
      // (missing columns fall back to their defaults). Skip + count bad rows
      // (e.g. an orphaned reference) rather than aborting the whole run.
      for (const row of rows) {
        try {
          await sql`insert into ${sql(table)} ${sql(row)} on conflict (legacy_mongo_id) do nothing`;
        } catch (e) {
          failed++;
          if (failed <= 2) console.log(`   ! ${table} row ${row.legacy_mongo_id}: ${e.message.slice(0, 90)}`);
        }
      }
    }
    console.log(`${table}: ${docs.length}${failed ? ` (${failed} skipped)` : ""}${dropped.size ? `  (dropped: ${[...dropped].join(", ")})` : ""}`);
  }

  // Singletons + string-keyed caches (custom shapes).
  const site = await mongo.collection("siteconfigs").findOne({});
  if (site) { const { _id, __v, ...cfg } = site; console.log(`site_config: 1`); if (APPLY) await sql`insert into site_config ${sql({ id: "global", config: clean(cfg, idMap) })} on conflict (id) do update set config = excluded.config`; }
  const fa = await mongo.collection("featureaccesses").findOne({});
  if (fa) { console.log(`feature_access: 1`); if (APPLY) await sql`insert into feature_access ${sql({ id: "global", access: fa.access ?? {} })} on conflict (id) do update set access = excluded.access`; }
  const plans = await mongo.collection("razorpayplans").find({}).toArray();
  console.log(`razorpay_plans: ${plans.length}`);
  if (APPLY) for (const p of plans) await sql`insert into razorpay_plans ${sql({ id: p._id.toString(), plan_id: p.planId, plan: p.plan, cycle: p.cycle, amount: p.amount })} on conflict (id) do nothing`;

  console.log(APPLY ? "\nBackfill complete ✓" : "\nDRY RUN — pass --apply to write.");
  await sql.end();
  await mongoose.disconnect();
}
main().catch((e) => { console.error("failed:", e.message); process.exit(1); });
