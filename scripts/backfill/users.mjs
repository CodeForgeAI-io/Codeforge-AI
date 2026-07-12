/**
 * Identity migration: MongoDB users → Supabase Auth (auth.users) + public.users
 * profile. Password hashes are imported as-is (bcrypt, verified compatible), so
 * users keep their passwords. OAuth-only users are created without a password
 * and re-link on next Google/GitHub sign-in.
 *
 * Idempotent: skips a user whose ObjectId is already a public.users
 * legacy_mongo_id. Dry-run by default; --apply to write.
 *
 *   node scripts/backfill/users.mjs           # dry run (counts)
 *   node scripts/backfill/users.mjs --apply   # migrate
 *
 * Run this FIRST in the core cutover — everything else FKs to users.
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

function profileRow(d, id) {
  const b = d.billing ?? null;
  return {
    id,
    legacy_mongo_id: d._id.toString(),
    name: d.name ?? "",
    username: d.username,
    email: String(d.email).toLowerCase(),
    image: d.image ?? null,
    role: d.role ?? "user",
    providers: d.providers ?? [],
    banned: !!d.banned,
    email_opt_out: !!d.emailOptOut,
    bio: d.bio ?? null,
    location: d.location ?? null,
    website: d.website ?? null,
    github_url: d.githubUrl ?? null,
    linkedin_url: d.linkedinUrl ?? null,
    stats: d.stats ?? {},
    preferences: d.preferences ?? {},
    onboarding: d.onboarding ?? {},
    plan: d.plan ?? "free",
    plan_expires_at: d.planExpiresAt ?? null,
    trial_ends_at: d.trialEndsAt ?? null,
    billing_cycle: d.billingCycle ?? null,
    razorpay_subscription_id: d.razorpaySubscriptionId ?? null,
    subscription_status: d.subscriptionStatus ?? null,
    cancel_at_period_end: !!d.cancelAtPeriodEnd,
    billing: b,
    beta_user: !!d.betaUser,
    created_at: d.createdAt ?? new Date(),
    updated_at: d.updatedAt ?? new Date(),
  };
}

async function main() {
  await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
  const users = await mongoose.connection.db.collection("users").find({}).toArray();
  const withPw = users.filter((u) => u.password).length;
  console.log(`MongoDB: ${users.length} users (${withPw} with password, ${users.length - withPw} OAuth-only)`);

  if (!APPLY) {
    console.log("DRY RUN — pass --apply to migrate identities into Supabase Auth.");
    await mongoose.disconnect();
    return;
  }

  const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  let done = 0, skipped = 0, failed = 0;
  for (const u of users) {
    if (!u.email) { skipped++; continue; }
    const legacy = u._id.toString();
    // idempotency: already imported?
    const { data: exists } = await sb.from("users").select("id").eq("legacy_mongo_id", legacy).maybeSingle();
    if (exists) { skipped++; continue; }
    try {
      const isAdmin = (env.ADMIN_EMAILS ?? env.ADMIN_EMAIL ?? "")
        .split(",").map((e) => e.trim().toLowerCase()).includes(String(u.email).toLowerCase());
      const created = await sb.auth.admin.createUser({
        email: String(u.email).toLowerCase(),
        email_confirm: true,
        ...(u.password ? { password_hash: u.password } : {}),
        user_metadata: { name: u.name ?? "", username: u.username },
        app_metadata: { role: u.role ?? (isAdmin ? "admin" : "user") },
      });
      if (created.error) throw new Error(created.error.message);
      const id = created.data.user.id;
      const { error: pErr } = await sb.from("users").insert(profileRow(u, id));
      if (pErr) throw new Error(pErr.message);
      done++;
      if (done % 50 === 0) console.log(`migrated ${done}…`);
    } catch (e) {
      failed++;
      console.error(`  FAILED ${u.email}: ${e.message}`);
    }
  }
  console.log(`Done. migrated=${done} skipped=${skipped} failed=${failed}`);
  await mongoose.disconnect();
}
main().catch((e) => { console.error("failed:", e.message); process.exit(1); });
