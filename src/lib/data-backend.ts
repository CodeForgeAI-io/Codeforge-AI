export type DataBackend = "mongo" | "supabase";

/**
 * Which backend a module reads/writes during the phased Supabase migration.
 *
 * Defaults to `mongo`, so nothing changes until a module is explicitly flipped.
 * - `DATA_BACKEND=supabase` moves everything, or
 * - `DATA_BACKEND_<MODULE>=supabase` moves one module (e.g. `DATA_BACKEND_FEEDBACK`).
 *
 * @param module - Module name, e.g. "feedback".
 */
export function backendFor(module: string): DataBackend {
  const per = process.env[`DATA_BACKEND_${module.toUpperCase()}`];
  const value = (per ?? process.env.DATA_BACKEND ?? "mongo").toLowerCase();
  return value === "supabase" ? "supabase" : "mongo";
}

/**
 * A uuid column can't hold a Mongo ObjectId. Until users are migrated,
 * `session.user.id` is still an ObjectId, so user links on the Supabase side
 * must be null (re-linked during the users backfill). Returns the id only if
 * it's already a uuid, else null.
 */
export function toUuidOrNull(id?: string | null): string | null {
  return id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) ? id : null;
}
