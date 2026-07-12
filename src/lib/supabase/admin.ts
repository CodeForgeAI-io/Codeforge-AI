import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase clients. Part of the phased MongoDB → Supabase migration
 * (see MIGRATION.md). During the migration the app still runs on MongoDB;
 * these clients are used by the new Postgres data layer as modules are ported.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

let admin: SupabaseClient | null = null;

/**
 * Server-only client using the service-role key. Bypasses RLS, so it must
 * NEVER be imported into client components. Use it in API routes / server
 * actions for trusted data access.
 */
export function supabaseAdmin(): SupabaseClient {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!url || !key) {
    throw new Error("Supabase admin is not configured (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY).");
  }
  if (!admin) {
    admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  return admin;
}

/** True when Supabase env is present. */
export function supabaseEnabled(): boolean {
  return Boolean(url && process.env.SUPABASE_SERVICE_ROLE_KEY);
}
