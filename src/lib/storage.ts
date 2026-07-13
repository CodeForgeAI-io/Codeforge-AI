import { put } from "@vercel/blob";
import { randomUUID } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { backendFor } from "@/lib/data-backend";

/**
 * File storage abstraction — Vercel Blob (default) or Supabase Storage, chosen
 * by `backendFor("storage")` (i.e. flips with `DATA_BACKEND=supabase`, or on
 * its own via `DATA_BACKEND_STORAGE=supabase`). Both return a public URL, so
 * downstream code (and the résumé-serve route, which just fetches the URL) is
 * backend-agnostic.
 */

export type StorageBucket = "resumes" | "newsletter";

/** True when the active storage backend is configured/usable. */
export function storageEnabled(): boolean {
  return backendFor("storage") === "supabase"
    ? Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)
    : Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

/** Filesystem-safe object key with a random prefix to avoid collisions. */
function safeKey(filename: string): string {
  const clean = filename.toLowerCase().replace(/[^a-z0-9.\-_]/g, "-").replace(/-+/g, "-").slice(-80);
  return `${randomUUID()}-${clean || "file"}`;
}

/**
 * Upload a file to a public bucket and return its public URL.
 * @param bucket - Logical bucket ("resumes" | "newsletter").
 * @param file - The uploaded File.
 * @param contentType - MIME type to store it as.
 */
export async function uploadPublicFile(
  bucket: StorageBucket,
  file: File,
  contentType: string,
): Promise<string> {
  if (backendFor("storage") === "supabase") {
    const key = safeKey(file.name);
    const bytes = new Uint8Array(await file.arrayBuffer());
    const sb = supabaseAdmin();
    const { error } = await sb.storage.from(bucket).upload(key, bytes, {
      contentType,
      upsert: false,
    });
    if (error) throw new Error(error.message);
    return sb.storage.from(bucket).getPublicUrl(key).data.publicUrl;
  }

  const blob = await put(`${bucket}/${file.name}`, file, {
    access: "public",
    addRandomSuffix: true,
    contentType,
  });
  return blob.url;
}
